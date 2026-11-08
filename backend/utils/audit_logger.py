import logging
import uuid
import hashlib
import json
import asyncio
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
from database import db

logger = logging.getLogger("metechq.audit")
audit_collection = db["audit_logs"]

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"
SENSITIVE_KEYS = {"password", "password_hash", "token", "access_token", "secret", "authorization", "value"}

# Threat boundary specification:
# Process-level serialization lock for atomic sequence and chain append operations.
# Note on operational boundaries:
# 1. Unkeyed SHA-256 hash chaining detects client-side log tampering, payload modifications,
#    intermediate record deletions, and record reordering.
# 2. It does NOT prevent a privileged database administrator with direct raw write access to MongoDB
#    from recomputing the hash chain across records.
# 3. The process-local asyncio.Lock serializes concurrent appends within a single process.
#    In multi-worker production deployments, database transactions or distributed locking (e.g., Redis)
#    are required to synchronize append sequences across worker instances.
_append_lock = asyncio.Lock()

AUDIT_SECURITY_BOUNDARY = (
    "Unkeyed SHA-256 hash-chaining with process-local append serialization. "
    "Detects client-side, application-level, and unauthorized payload modifications, omissions, "
    "and out-of-order mutations. Does not prevent a privileged database administrator with direct "
    "raw write access to MongoDB from rewriting the chain, nor does a process-local lock guarantee "
    "concurrency across multiple worker processes without external distributed synchronization."
)

def sanitize_details(details: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Recursively redacts sensitive keys from audit log details"""
    if not details:
        return {}
    sanitized = {}
    for k, v in details.items():
        if k.lower() in SENSITIVE_KEYS:
            sanitized[k] = "[REDACTED]"
        elif isinstance(v, dict):
            sanitized[k] = sanitize_details(v)
        else:
            sanitized[k] = v
    return sanitized

def compute_entry_hash(
    sequence: int,
    timestamp: str,
    actor_id: str,
    actor_name: str,
    actor_role: str,
    action: str,
    resource_type: str,
    resource_id: str,
    ip_address: str,
    status: str,
    prev_hash: str,
    details: Dict[str, Any]
) -> str:
    """
    Computes deterministic SHA-256 hash sealing ALL security-relevant fields:
    sequence, timestamp, actor_id, actor_name, actor_role, action, resource_type,
    resource_id, ip_address, status, prev_hash, and deterministic sorted details.
    """
    details_serialized = json.dumps(details, sort_keys=True, default=str)
    payload = (
        f"{sequence}|{timestamp}|{actor_id}|{actor_name}|{actor_role}|"
        f"{action}|{resource_type}|{resource_id}|{ip_address}|{status}|"
        f"{prev_hash}|{details_serialized}"
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def compute_entry_hash_v1(
    sequence: int,
    timestamp: str,
    actor_id: str,
    action: str,
    resource_type: str,
    resource_id: str,
    status: str,
    prev_hash: str,
    details: Dict[str, Any]
) -> str:
    """Computes deterministic SHA-256 hash for legacy v1 audit entries"""
    details_serialized = json.dumps(details, sort_keys=True, default=str)
    payload = f"{sequence}|{timestamp}|{actor_id}|{action}|{resource_type}|{resource_id}|{status}|{prev_hash}|{details_serialized}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

async def record_audit_log(
    actor_id: str,
    actor_name: str,
    actor_role: str,
    action: str,
    resource_type: str,
    resource_id: str = "",
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    status: str = "success"
) -> Optional[str]:
    """
    Persists a cryptographically sealed, tamper-evident audit log document.
    Serializes concurrent appends via an async mutex to prevent sequence race conditions within the process.
    Chains the entry to the preceding document via SHA-256 hash chaining.
    """
    async with _append_lock:
        try:
            clean_details = sanitize_details(details)
            timestamp = datetime.utcnow().isoformat()
            resolved_ip = ip_address or "unknown"

            # Retrieve the latest entry to link the hash chain
            latest_entry = await audit_collection.find_one(
                sort=[("sequence", -1)]
            )

            if latest_entry:
                sequence = latest_entry.get("sequence", 0) + 1
                prev_hash = latest_entry.get("entry_hash", GENESIS_HASH)
            else:
                sequence = 1
                prev_hash = GENESIS_HASH

            entry_hash = compute_entry_hash(
                sequence=sequence,
                timestamp=timestamp,
                actor_id=actor_id,
                actor_name=actor_name,
                actor_role=actor_role,
                action=action,
                resource_type=resource_type,
                resource_id=str(resource_id),
                ip_address=resolved_ip,
                status=status,
                prev_hash=prev_hash,
                details=clean_details
            )

            log_entry = {
                "id": str(uuid.uuid4()),
                "sequence": sequence,
                "timestamp": timestamp,
                "actor_id": actor_id,
                "actor_name": actor_name,
                "actor_role": actor_role,
                "action": action,
                "resource_type": resource_type,
                "resource_id": str(resource_id),
                "ip_address": resolved_ip,
                "status": status,
                "details": clean_details,
                "prev_hash": prev_hash,
                "entry_hash": entry_hash
            }

            await audit_collection.insert_one(log_entry)
            return entry_hash
        except Exception as e:
            logger.error(f"Failed to record audit log: {str(e)}")
            return None

async def verify_audit_log_chain(limit: int = 1000) -> Dict[str, Any]:
    """
    Verifies cryptographic hash-chain integrity of audit log entries.
    Detects any modification, insertion, deletion, or reordering of records.
    Distinguishes 'all records scanned' from 'all records cryptographically verified'.
    Never reports a mixed-legacy or truncated scan as a complete verification.
    """
    try:
        total_in_db = await audit_collection.count_documents({})
        cursor = audit_collection.find().sort("sequence", 1).limit(limit)
        entries = await cursor.to_list(length=limit)
        records_scanned = len(entries)

        if total_in_db == 0:
            return {
                "verified": True,
                "chain_intact": True,
                "fully_verified_collection": True,
                "total_records_in_db": 0,
                "records_scanned": 0,
                "records_verified": 0,
                "is_truncated": False,
                "complete_scan": True,
                "legacy_records_skipped": 0,
                "status": "empty",
                "broken_at_index": None,
                "broken_sequence": None,
                "error": None,
                "message": "Audit log is empty (genesis state).",
                "limit_applied": limit,
                "security_boundary": AUDIT_SECURITY_BOUNDARY
            }

        expected_prev_hash = GENESIS_HASH
        expected_sequence = 1
        legacy_records_skipped = 0
        records_verified = 0

        for idx, entry in enumerate(entries):
            seq = entry.get("sequence")
            prev_hash = entry.get("prev_hash")
            stored_hash = entry.get("entry_hash")

            # Check for legacy unchained entries before sequence begins
            if seq is None or stored_hash is None:
                if expected_sequence == 1:
                    legacy_records_skipped += 1
                    continue
                else:
                    return {
                        "verified": False,
                        "chain_intact": False,
                        "fully_verified_collection": False,
                        "total_records_in_db": total_in_db,
                        "records_scanned": records_scanned,
                        "records_verified": records_verified,
                        "is_truncated": total_in_db > records_scanned,
                        "complete_scan": False,
                        "legacy_records_skipped": legacy_records_skipped,
                        "status": "tampered",
                        "broken_at_index": idx,
                        "broken_sequence": None,
                        "error": f"Unchained legacy entry encountered at index {idx} after sequence {expected_sequence - 1}.",
                        "message": f"Integrity failure: unchained record found at index {idx}.",
                        "limit_applied": limit,
                        "security_boundary": AUDIT_SECURITY_BOUNDARY
                    }

            # Verify sequence continuity (detects deletions and insertions)
            if seq != expected_sequence:
                return {
                    "verified": False,
                    "chain_intact": False,
                    "fully_verified_collection": False,
                    "total_records_in_db": total_in_db,
                    "records_scanned": records_scanned,
                    "records_verified": records_verified,
                    "is_truncated": total_in_db > records_scanned,
                    "complete_scan": False,
                    "legacy_records_skipped": legacy_records_skipped,
                    "status": "sequence_gap",
                    "broken_at_index": idx,
                    "broken_sequence": seq,
                    "error": f"Sequence gap detected! Expected {expected_sequence}, found {seq}. Indicates record deletion or insertion.",
                    "message": f"Sequence gap detected at record {idx} (expected sequence {expected_sequence}, found {seq}).",
                    "limit_applied": limit,
                    "security_boundary": AUDIT_SECURITY_BOUNDARY
                }

            # Verify link to previous entry (detects reordering)
            if prev_hash != expected_prev_hash:
                return {
                    "verified": False,
                    "chain_intact": False,
                    "fully_verified_collection": False,
                    "total_records_in_db": total_in_db,
                    "records_scanned": records_scanned,
                    "records_verified": records_verified,
                    "is_truncated": total_in_db > records_scanned,
                    "complete_scan": False,
                    "legacy_records_skipped": legacy_records_skipped,
                    "status": "broken_link",
                    "broken_at_index": idx,
                    "broken_sequence": seq,
                    "error": f"Chain link broken at sequence {seq}. Previous hash mismatch.",
                    "message": f"Chain link broken at sequence {seq}.",
                    "limit_applied": limit,
                    "security_boundary": AUDIT_SECURITY_BOUNDARY
                }

            # Verify entry content has not been tampered with
            recomputed_hash = compute_entry_hash(
                sequence=seq,
                timestamp=entry.get("timestamp", ""),
                actor_id=entry.get("actor_id", ""),
                actor_name=entry.get("actor_name", ""),
                actor_role=entry.get("actor_role", ""),
                action=entry.get("action", ""),
                resource_type=entry.get("resource_type", ""),
                resource_id=entry.get("resource_id", ""),
                ip_address=entry.get("ip_address", "unknown"),
                status=entry.get("status", ""),
                prev_hash=prev_hash,
                details=entry.get("details", {})
            )

            if stored_hash != recomputed_hash:
                # Check backwards-compatibility for legacy v1 entries
                recomputed_v1 = compute_entry_hash_v1(
                    sequence=seq,
                    timestamp=entry.get("timestamp", ""),
                    actor_id=entry.get("actor_id", ""),
                    action=entry.get("action", ""),
                    resource_type=entry.get("resource_type", ""),
                    resource_id=entry.get("resource_id", ""),
                    status=entry.get("status", ""),
                    prev_hash=prev_hash,
                    details=entry.get("details", {})
                )
                if stored_hash != recomputed_v1:
                    return {
                        "verified": False,
                        "chain_intact": False,
                        "fully_verified_collection": False,
                        "total_records_in_db": total_in_db,
                        "records_scanned": records_scanned,
                        "records_verified": records_verified,
                        "is_truncated": total_in_db > records_scanned,
                        "complete_scan": False,
                        "legacy_records_skipped": legacy_records_skipped,
                        "status": "tampered",
                        "broken_at_index": idx,
                        "broken_sequence": seq,
                        "error": f"Tampering detected! Recomputed hash does not match stored hash at sequence {seq}.",
                        "message": f"Tampering detected at sequence {seq}.",
                        "limit_applied": limit,
                        "security_boundary": AUDIT_SECURITY_BOUNDARY
                    }

            expected_prev_hash = stored_hash
            expected_sequence += 1
            records_verified += 1

        is_truncated = total_in_db > records_scanned
        complete_scan = not is_truncated

        # Case 1: Only unchained legacy records exist
        if records_verified == 0 and legacy_records_skipped > 0:
            return {
                "verified": False,
                "chain_intact": False,
                "fully_verified_collection": False,
                "total_records_in_db": total_in_db,
                "records_scanned": records_scanned,
                "records_verified": 0,
                "is_truncated": is_truncated,
                "complete_scan": complete_scan,
                "legacy_records_skipped": legacy_records_skipped,
                "status": "legacy_unchained",
                "broken_at_index": None,
                "broken_sequence": None,
                "error": "Audit log contains only unchained legacy records without cryptographic hashes.",
                "message": f"No sequenced records found. {legacy_records_skipped} unchained legacy records skipped.",
                "limit_applied": limit,
                "security_boundary": AUDIT_SECURITY_BOUNDARY
            }

        # Case 2: Mixed log (legacy records skipped alongside verified chain)
        # Even if all records were scanned, the collection is NOT fully verified because unchained records exist!
        if legacy_records_skipped > 0:
            return {
                "verified": True,
                "chain_intact": True,
                "fully_verified_collection": False,
                "total_records_in_db": total_in_db,
                "records_scanned": records_scanned,
                "records_verified": records_verified,
                "is_truncated": is_truncated,
                "complete_scan": complete_scan,
                "legacy_records_skipped": legacy_records_skipped,
                "status": "legacy_mixed_chain",
                "broken_at_index": None,
                "broken_sequence": None,
                "error": None,
                "message": (
                    f"Mixed collection: {records_verified} records cryptographically verified, "
                    f"but {legacy_records_skipped} unchained legacy records were skipped. "
                    "Collection cannot be labeled fully verified."
                ),
                "limit_applied": limit,
                "security_boundary": AUDIT_SECURITY_BOUNDARY
            }

        # Case 3: Truncated scan (limit reached before reaching end of collection)
        if is_truncated:
            return {
                "verified": True,
                "chain_intact": True,
                "fully_verified_collection": False,
                "total_records_in_db": total_in_db,
                "records_scanned": records_scanned,
                "records_verified": records_verified,
                "is_truncated": True,
                "complete_scan": False,
                "legacy_records_skipped": 0,
                "status": "partial_verified",
                "broken_at_index": None,
                "broken_sequence": None,
                "error": None,
                "message": (
                    f"Partial audit scan: verified {records_verified} of {total_in_db} records. "
                    f"Verification limit ({limit}) reached; scan is incomplete."
                ),
                "limit_applied": limit,
                "security_boundary": AUDIT_SECURITY_BOUNDARY
            }

        # Case 4: Complete and fully verified collection (100% scanned, 0 legacy skipped, all hashes valid)
        return {
            "verified": True,
            "chain_intact": True,
            "fully_verified_collection": True,
            "total_records_in_db": total_in_db,
            "records_scanned": records_scanned,
            "records_verified": records_verified,
            "is_truncated": False,
            "complete_scan": True,
            "legacy_records_skipped": 0,
            "status": "verified",
            "broken_at_index": None,
            "broken_sequence": None,
            "error": None,
            "message": f"Cryptographic audit chain fully verified ({records_verified} records intact).",
            "limit_applied": limit,
            "security_boundary": AUDIT_SECURITY_BOUNDARY
        }
    except Exception as e:
        logger.error(f"Audit log verification failed: {e}")
        return {
            "verified": False,
            "chain_intact": False,
            "fully_verified_collection": False,
            "total_records_in_db": 0,
            "records_scanned": 0,
            "records_verified": 0,
            "is_truncated": False,
            "complete_scan": False,
            "legacy_records_skipped": 0,
            "status": "error",
            "broken_at_index": None,
            "broken_sequence": None,
            "error": str(e),
            "message": f"Audit log verification encountered internal error: {str(e)}",
            "limit_applied": limit,
            "security_boundary": AUDIT_SECURITY_BOUNDARY
        }
