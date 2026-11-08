import pytest
import requests
import uuid
import sys
import os
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

# Ensure backend directory is in sys.path
backend_path = Path(__file__).resolve().parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

BASE_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:8002/api")

@pytest.fixture(scope="module")
def admin_token():
    """Authenticates as super admin and yields JWT bearer token"""
    username = os.environ.get("ADMIN_USERNAME")
    password = os.environ.get("ADMIN_PASSWORD")
    if not username or not password:
        pytest.skip("Use scripts/run_evaluation_tests.py to provision an isolated test admin")
    res = requests.post(f"{BASE_URL}/admins/login", json={"username": username, "password": password}, timeout=15)
    assert res.status_code == 200, "Isolated test admin login failed"
    return res.json().get("token") or res.json()["access_token"]

# ==============================================================================
# 1. ROOT & PUBLIC ACCESS TESTS
# ==============================================================================

def test_api_root_healthy():
    res = requests.get(f"{BASE_URL}/")
    assert res.status_code == 200
    assert "METECHQ API is running" in res.json().get("message", "")

def test_public_projects_readable():
    res = requests.get(f"{BASE_URL}/projects/")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_public_services_readable():
    res = requests.get(f"{BASE_URL}/services/")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_public_about_readable():
    res = requests.get(f"{BASE_URL}/about/")
    assert res.status_code == 200

def test_public_settings_readable():
    res = requests.get(f"{BASE_URL}/settings/")
    assert res.status_code == 200

def test_security_headers_present():
    res = requests.get(f"{BASE_URL}/")
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") in ("DENY", "SAMEORIGIN")
    assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

# ==============================================================================
# 2. NEGATIVE SECURITY TESTS — UNPROTECTED ENDPOINTS ELIMINATED
# ==============================================================================

def test_unauthenticated_contacts_all_forbidden():
    res = requests.get(f"{BASE_URL}/contacts/admin/all")
    assert res.status_code == 401

def test_unauthenticated_contact_update_forbidden():
    res = requests.put(f"{BASE_URL}/contacts/dummy-id", json={"name": "Attacker"})
    assert res.status_code == 401

def test_unauthenticated_contact_deletion_forbidden():
    res = requests.delete(f"{BASE_URL}/contacts/dummy-id")
    assert res.status_code == 401

def test_unauthenticated_content_update_forbidden():
    res = requests.put(f"{BASE_URL}/content/", json={"hero": {"title": "Defaced"}})
    assert res.status_code == 401

def test_unauthenticated_pages_update_forbidden():
    res = requests.put(f"{BASE_URL}/pages/home", json={"hero": "Defaced"})
    assert res.status_code == 401

def test_unauthenticated_project_creation_forbidden():
    res = requests.post(f"{BASE_URL}/projects/", json={"title": "Hacked Project"})
    assert res.status_code == 401

def test_unauthenticated_service_creation_forbidden():
    res = requests.post(f"{BASE_URL}/services/", json={"title": "Hacked Service"})
    assert res.status_code == 401

def test_unauthenticated_settings_update_forbidden():
    res = requests.put(f"{BASE_URL}/settings/", json={"agency_name": "Hacked"})
    assert res.status_code == 401

def test_unauthenticated_user_registration_forbidden():
    res = requests.post(
        f"{BASE_URL}/auth/register",
        json={"name": "Attacker", "email": "attacker@evil.com", "password": "Password123!", "role": "super_admin"}
    )
    assert res.status_code in [401, 403]

# ==============================================================================
# 3. AUTHENTICATION & RATE LIMITING TESTS
# ==============================================================================

def test_invalid_login_rejected():
    res = requests.post(
        f"{BASE_URL}/admins/login",
        json={"username": "nonexistent_admin", "password": "wrong_password_123"}
    )
    assert res.status_code == 401

def test_client_invalid_login_rejected():
    res = requests.post(
        f"{BASE_URL}/client/auth/login",
        json={"email": "nonexistent_client@test.com", "password": "wrong_password"}
    )
    assert res.status_code == 401

# ==============================================================================
# 4. AUTHORIZED ADMIN FUNCTIONALITY TESTS
# ==============================================================================

def test_admin_contacts_accessible(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = requests.get(f"{BASE_URL}/contacts/admin/all", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_admin_notes_crud_sanitized(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    # Create note
    res = requests.post(
        f"{BASE_URL}/notes/",
        headers=headers,
        json={"name": "Test Note Security", "content": "Security testing content", "tags": ["qa", "security"]}
    )
    assert res.status_code == 200
    note_id = res.json()["id"]

    # Search with regex special characters to test ReDoS escaping
    search_res = requests.get(f"{BASE_URL}/notes/?search=Security.*", headers=headers)
    assert search_res.status_code == 200

    # Delete note
    del_res = requests.delete(f"{BASE_URL}/notes/{note_id}", headers=headers)
    assert del_res.status_code == 200

def test_admin_audit_logs_accessible(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = requests.get(f"{BASE_URL}/admins/audit-logs", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "audit_logs" in data
    assert isinstance(data["audit_logs"], list)

# ==============================================================================
# 5. FILE UPLOAD SECURITY TESTS
# ==============================================================================

def test_upload_disallowed_extension_rejected(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    files = {"file": ("malicious.exe", b"MZDummyExecutablePayload", "application/x-msdownload")}
    res = requests.post(f"{BASE_URL}/storage/upload", headers=headers, files=files)
    assert res.status_code == 400
    assert "not permitted" in res.json().get("detail", "")

def test_upload_script_svg_rejected(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    svg_payload = b"<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"
    files = {"file": ("xss.svg", svg_payload, "image/svg+xml")}
    res = requests.post(f"{BASE_URL}/storage/upload", headers=headers, files=files)
    assert res.status_code == 400
    assert "not permitted" in res.json().get("detail", "")

def test_admin_audit_chain_integrity(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = requests.get(f"{BASE_URL}/admins/audit-logs/verify", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data.get("verified") is True
    assert data.get("chain_intact") is True

def test_rate_limiter_sliding_window_active():
    unique_user = f"attacker_{uuid.uuid4().hex[:8]}"
    for i in range(5):
        requests.post(f"{BASE_URL}/admins/login", json={"username": unique_user, "password": "WrongPassword!"})
    # 6th attempt should be blocked with 429 Too Many Requests
    blocked_res = requests.post(f"{BASE_URL}/admins/login", json={"username": unique_user, "password": "WrongPassword!"})
    assert blocked_res.status_code == 429
    assert "Too many failed login attempts" in blocked_res.json().get("detail", "")


# ==============================================================================
# 6. PRIVATE FILE DOWNLOAD PERMISSIONS & OWNERSHIP TESTS
# ==============================================================================

def test_private_file_download_permissions(admin_token):
    """
    Verifies that private file downloads enforce strict permissions:
    - Super admins have full access.
    - Admins without canAccessStorage are rejected with 403 Forbidden.
    - Admins with canAccessStorage but not in visibleTo/creator are rejected with 403 Forbidden.
    - Admins in visibleTo can download successfully (200 OK).
    - Unauthenticated requests are rejected with 401 Unauthorized.
    """
    super_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 1. Upload a file as super_admin
    test_pdf_content = b"%PDF-1.4 confidential enterprise report content"
    files = {"file": ("confidential_report.pdf", test_pdf_content, "application/pdf")}
    upload_res = requests.post(f"{BASE_URL}/storage/upload", headers=super_headers, files=files)
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    uploaded_filename = upload_res.json()["url"].split("/")[-1]

    # 2. Register distinct admin accounts for granular permission testing
    no_storage_user = f"nostorage_{uuid.uuid4().hex[:6]}"
    disallowed_user = f"disallowed_{uuid.uuid4().hex[:6]}"
    allowed_viewer = f"allowed_{uuid.uuid4().hex[:6]}"
    test_password = "SecureTestPassword123!"

    # Admin without storage permission
    r1 = requests.post(f"{BASE_URL}/admins/create", headers=super_headers, json={
        "username": no_storage_user,
        "password": test_password,
        "role": "admin",
        "permissions": {"canAccessStorage": False}
    })
    assert r1.status_code == 200
    no_storage_id = r1.json()["id"]

    # Admin with storage permission, but will NOT be in visibleTo
    r2 = requests.post(f"{BASE_URL}/admins/create", headers=super_headers, json={
        "username": disallowed_user,
        "password": test_password,
        "role": "admin",
        "permissions": {"canAccessStorage": True}
    })
    assert r2.status_code == 200
    disallowed_id = r2.json()["id"]

    # Admin with storage permission and WILL be in visibleTo
    r3 = requests.post(f"{BASE_URL}/admins/create", headers=super_headers, json={
        "username": allowed_viewer,
        "password": test_password,
        "role": "admin",
        "permissions": {"canAccessStorage": True}
    })
    assert r3.status_code == 200
    allowed_id = r3.json()["id"]

    item_id = None
    try:
        # Create storage item referencing the file with restricted visibleTo list
        item_res = requests.post(f"{BASE_URL}/storage/items", headers=super_headers, json={
            "title": "Confidential Storage Item",
            "type": "document",
            "fileName": uploaded_filename,
            "fileUrl": f"/api/storage/files/{uploaded_filename}",
            "visibleTo": [allowed_viewer]
        })
        assert item_res.status_code == 200
        item_id = item_res.json()["id"]

        # Authenticate all test admins
        t_no_storage = requests.post(f"{BASE_URL}/admins/login", json={"username": no_storage_user, "password": test_password}).json().get("token")
        t_disallowed = requests.post(f"{BASE_URL}/admins/login", json={"username": disallowed_user, "password": test_password}).json().get("token")
        t_allowed = requests.post(f"{BASE_URL}/admins/login", json={"username": allowed_viewer, "password": test_password}).json().get("token")

        # Test A: Unauthenticated download -> 401
        res_unauth = requests.get(f"{BASE_URL}/storage/files/{uploaded_filename}")
        assert res_unauth.status_code == 401

        # Test B: Admin without canAccessStorage -> 403 Forbidden
        res_no_storage = requests.get(
            f"{BASE_URL}/storage/files/{uploaded_filename}",
            headers={"Authorization": f"Bearer {t_no_storage}"}
        )
        assert res_no_storage.status_code == 403
        assert "permission to access storage" in res_no_storage.json().get("detail", "")

        # Test C: Admin with canAccessStorage but not in visibleTo -> 403 Forbidden
        res_disallowed = requests.get(
            f"{BASE_URL}/storage/files/{uploaded_filename}",
            headers={"Authorization": f"Bearer {t_disallowed}"}
        )
        assert res_disallowed.status_code == 403
        assert "visibility permissions" in res_disallowed.json().get("detail", "")

        # Test D: Admin in visibleTo with canAccessStorage -> 200 OK
        res_allowed = requests.get(
            f"{BASE_URL}/storage/files/{uploaded_filename}",
            headers={"Authorization": f"Bearer {t_allowed}"}
        )
        assert res_allowed.status_code == 200
        assert res_allowed.content == test_pdf_content

        # Test E: Super admin -> 200 OK (bypass / elevated authority)
        res_super = requests.get(
            f"{BASE_URL}/storage/files/{uploaded_filename}",
            headers=super_headers
        )
        assert res_super.status_code == 200
        assert res_super.content == test_pdf_content

    finally:
        # Cleanup storage item and test admin accounts
        if item_id:
            try:
                requests.delete(f"{BASE_URL}/storage/items/{item_id}", headers=super_headers)
            except Exception:
                pass
        for a_id in [no_storage_id, disallowed_id, allowed_id]:
            try:
                requests.delete(f"{BASE_URL}/admins/{a_id}", headers=super_headers)
            except Exception:
                pass


# ==============================================================================
# 7. RATE LIMITING CONCURRENCY & OUTAGE BEHAVIOR TESTS
# ==============================================================================

def test_rate_limiter_simultaneous_concurrency_and_outage_fallback():
    """
    Verifies that the rate limiter:
    1. Uses atomic check-and-record to prevent race conditions during simultaneous requests.
    2. Gracefully falls back to atomic in-memory sliding window when Redis is unavailable.
    """
    attacker_ip_user = f"concurrent_attacker_{uuid.uuid4().hex[:6]}"
    
    def attempt_login():
        return requests.post(
            f"{BASE_URL}/admins/login",
            json={"username": attacker_ip_user, "password": "WrongPassword123!"}
        ).status_code

    # Dispatch 15 simultaneous requests across 10 threads
    with ThreadPoolExecutor(max_workers=10) as executor:
        statuses = list(executor.map(lambda _: attempt_login(), range(15)))

    # Exactly 5 should be accepted for credential check (401), the rest rejected (429)
    blocked_count = statuses.count(429)
    unauthorized_count = statuses.count(401)
    
    assert unauthorized_count <= 5, f"Atomic limit breached: {unauthorized_count} attempts bypassed rate limiting!"
    assert blocked_count >= 10, f"Expected at least 10 blocked requests, got {blocked_count}"

    # Unit test Redis outage fallback
    from utils.rate_limiter import HybridRateLimiter
    offline_limiter = HybridRateLimiter(redis_url="redis://127.0.0.1:59999")
    assert offline_limiter.is_distributed is False

    test_key = f"outage_key_{uuid.uuid4().hex[:8]}"
    for _ in range(3):
        allowed, retry = offline_limiter.check_and_record(test_key, max_attempts=3, window_seconds=60)
        assert allowed is True
        assert retry == 0

    # 4th attempt must be rejected without raising any Redis exceptions
    allowed, retry = offline_limiter.check_and_record(test_key, max_attempts=3, window_seconds=60)
    assert allowed is False
    assert retry > 0


# ==============================================================================
# 8. AUDIT LOG CRYPTOGRAPHIC TAMPER DETECTION TESTS
# ==============================================================================

def test_audit_chain_tamper_detection_scenarios():
    """
    Unit-tests the hash-chain verification algorithm against:
    - Modification: alteration of any security-relevant field.
    - Insertion: insertion of an unlinked or out-of-sequence record.
    - Deletion: omission of an intermediate sequence record.
    - Reordering: swapping sequence records.
    """
    from utils.audit_logger import compute_entry_hash, GENESIS_HASH

    # 1. Build an authentic 3-record chain
    rec1_hash = compute_entry_hash(
        sequence=1, timestamp="2026-11-06T12:00:00", actor_id="1", actor_name="admin",
        actor_role="super_admin", action="login", resource_type="auth", resource_id="",
        ip_address="127.0.0.1", status="success", prev_hash=GENESIS_HASH, details={}
    )
    rec1 = {
        "sequence": 1, "timestamp": "2026-11-06T12:00:00", "actor_id": "1", "actor_name": "admin",
        "actor_role": "super_admin", "action": "login", "resource_type": "auth", "resource_id": "",
        "ip_address": "127.0.0.1", "status": "success", "prev_hash": GENESIS_HASH, "entry_hash": rec1_hash, "details": {}
    }

    rec2_hash = compute_entry_hash(
        sequence=2, timestamp="2026-11-06T12:01:00", actor_id="1", actor_name="admin",
        actor_role="super_admin", action="create_item", resource_type="storage", resource_id="doc1",
        ip_address="127.0.0.1", status="success", prev_hash=rec1_hash, details={"file": "contract.pdf"}
    )
    rec2 = {
        "sequence": 2, "timestamp": "2026-11-06T12:01:00", "actor_id": "1", "actor_name": "admin",
        "actor_role": "super_admin", "action": "create_item", "resource_type": "storage", "resource_id": "doc1",
        "ip_address": "127.0.0.1", "status": "success", "prev_hash": rec1_hash, "entry_hash": rec2_hash, "details": {"file": "contract.pdf"}
    }

    rec3_hash = compute_entry_hash(
        sequence=3, timestamp="2026-11-06T12:02:00", actor_id="1", actor_name="admin",
        actor_role="super_admin", action="logout", resource_type="auth", resource_id="",
        ip_address="127.0.0.1", status="success", prev_hash=rec2_hash, details={}
    )
    rec3 = {
        "sequence": 3, "timestamp": "2026-11-06T12:02:00", "actor_id": "1", "actor_name": "admin",
        "actor_role": "super_admin", "action": "logout", "resource_type": "auth", "resource_id": "",
        "ip_address": "127.0.0.1", "status": "success", "prev_hash": rec2_hash, "entry_hash": rec3_hash, "details": {}
    }

    def verify_chain(entries):
        expected_prev_hash = GENESIS_HASH
        expected_sequence = 1
        for idx, entry in enumerate(entries):
            seq = entry.get("sequence")
            prev_hash = entry.get("prev_hash")
            stored_hash = entry.get("entry_hash")
            if seq != expected_sequence:
                return False, f"Sequence gap: expected {expected_sequence}, found {seq}"
            if prev_hash != expected_prev_hash:
                return False, f"Chain link broken at seq {seq}"
            recomputed = compute_entry_hash(
                sequence=seq, timestamp=entry.get("timestamp", ""), actor_id=entry.get("actor_id", ""),
                actor_name=entry.get("actor_name", ""), actor_role=entry.get("actor_role", ""),
                action=entry.get("action", ""), resource_type=entry.get("resource_type", ""),
                resource_id=entry.get("resource_id", ""), ip_address=entry.get("ip_address", "unknown"),
                status=entry.get("status", ""), prev_hash=prev_hash, details=entry.get("details", {})
            )
            if stored_hash != recomputed:
                return False, f"Tampering detected at seq {seq}"
            expected_prev_hash = stored_hash
            expected_sequence += 1
        return True, "Chain intact"

    # Intact chain must pass
    valid, msg = verify_chain([rec1, rec2, rec3])
    assert valid is True

    # Scenario A: Field modification in rec2 (e.g. attacker changes role or details)
    tampered_rec2 = dict(rec2)
    tampered_rec2["details"] = {"file": "malicious.exe"}
    valid, msg = verify_chain([rec1, tampered_rec2, rec3])
    assert valid is False
    assert "Tampering detected at seq 2" in msg

    # Scenario B: Deletion of intermediate record (rec2 omitted)
    valid, msg = verify_chain([rec1, rec3])
    assert valid is False
    assert "Sequence gap" in msg

    # Scenario C: Reordering (rec2 and rec3 swapped)
    valid, msg = verify_chain([rec1, rec3, rec2])
    assert valid is False
    assert "Sequence gap" in msg or "Chain link broken" in msg

    # Scenario D: Insertion of an unauthorized intermediate record
    rogue_rec = dict(rec2)
    rogue_rec["sequence"] = 2
    rogue_rec["entry_hash"] = "forged_hash"
    valid, msg = verify_chain([rec1, rogue_rec, rec2, rec3])
    assert valid is False

