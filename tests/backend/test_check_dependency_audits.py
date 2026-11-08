import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import pytest
from scripts.check_dependency_audits import (
    evaluate_backend_audit_data,
    evaluate_frontend_audit_lines,
    BACKEND_BASELINE,
    FRONTEND_BASELINE,
    BACKEND_KNOWN_PACKAGES,
    FRONTEND_KNOWN_PACKAGES
)

# ------------------------------------------------------------------------------
# 1. Backend Dependency Audit Tests
# ------------------------------------------------------------------------------

def test_backend_audit_success_matching_baseline():
    """Matches the accepted 96 advisories across 16 documented packages."""
    mock_deps = []
    # 16 packages with 6 vulns each = 96 vulns
    for pkg in list(BACKEND_KNOWN_PACKAGES)[:16]:
        mock_deps.append({
            "name": pkg,
            "version": "1.0.0",
            "vulns": [{"id": f"CVE-2026-00{i}"} for i in range(6)]
        })
    data = {"dependencies": mock_deps}
    passed, report = evaluate_backend_audit_data(data)
    assert passed is True
    assert "[AUDIT COMPLETED WITH FINDINGS]" in report
    assert "96 advisories across 16 pinned runtime packages" in report


def test_backend_audit_clean_zero_vulnerabilities():
    """Clean audit with 0 vulnerabilities returns AUDIT CLEAN."""
    mock_deps = [{"name": "annotated-types", "version": "0.7.0", "vulns": []}]
    data = {"dependencies": mock_deps}
    passed, report = evaluate_backend_audit_data(data)
    assert passed is True
    assert "[AUDIT CLEAN]" in report


def test_backend_audit_failure_new_unapproved_package():
    """Rejects unapproved vulnerable packages not in the documented baseline."""
    mock_deps = [
        {"name": "anyio", "version": "4.12.1", "vulns": [{"id": "PYSEC-2026-4025"}]},
        {"name": "unapproved-malicious-pkg", "version": "0.1.0", "vulns": [{"id": "CVE-2026-9999"}]}
    ]
    data = {"dependencies": mock_deps}
    passed, report = evaluate_backend_audit_data(data)
    assert passed is False
    assert "[POLICY FAILURE]" in report
    assert "unapproved-malicious-pkg" in report


def test_backend_audit_failure_increased_findings():
    """Fails when total advisory count exceeds the documented baseline (96)."""
    mock_deps = [
        {"name": "starlette", "version": "0.37.2", "vulns": [{"id": f"CVE-2026-{i}"} for i in range(100)]}
    ]
    data = {"dependencies": mock_deps}
    passed, report = evaluate_backend_audit_data(data)
    assert passed is False
    assert "[POLICY FAILURE] Total advisories (100) exceeds documented baseline (96)" in report


def test_backend_audit_failure_invalid_json():
    """Fails gracefully when output lacks the expected structure."""
    passed, report = evaluate_backend_audit_data({"error": "Failed to parse requirements"})
    assert passed is False
    assert "Invalid pip-audit output" in report


# ------------------------------------------------------------------------------
# 2. Frontend Dependency Audit Tests
# ------------------------------------------------------------------------------

def test_frontend_audit_success_matching_baseline():
    """Matches the accepted 40 advisories in CRA build toolchain."""
    lines = [
        json.dumps({"type": "auditAdvisory", "data": {"advisory": {"module_name": "ajv"}}}),
        json.dumps({"type": "auditAdvisory", "data": {"advisory": {"module_name": "postcss"}}}),
        json.dumps({"type": "auditSummary", "data": {"vulnerabilities": {"info": 0, "low": 8, "moderate": 23, "high": 9, "critical": 0}}})
    ]
    passed, report = evaluate_frontend_audit_lines(lines)
    assert passed is True
    assert "[AUDIT COMPLETED WITH FINDINGS]" in report
    assert "40 advisories (8 Low, 23 Moderate, 9 High)" in report


def test_frontend_audit_clean_zero_vulnerabilities():
    """Clean frontend audit with 0 vulnerabilities returns AUDIT CLEAN."""
    lines = [
        json.dumps({"type": "auditSummary", "data": {"vulnerabilities": {"info": 0, "low": 0, "moderate": 0, "high": 0, "critical": 0}}})
    ]
    passed, report = evaluate_frontend_audit_lines(lines)
    assert passed is True
    assert "[AUDIT CLEAN]" in report


def test_frontend_audit_failure_missing_summary():
    """Treats missing auditSummary as a failure (e.g. yarn crashed)."""
    lines = [
        json.dumps({"type": "auditAdvisory", "data": {"advisory": {"module_name": "ajv"}}})
    ]
    passed, report = evaluate_frontend_audit_lines(lines)
    assert passed is False
    assert "auditSummary record not found" in report


def test_frontend_audit_failure_increased_findings():
    """Fails when high advisories exceed the baseline of 9."""
    lines = [
        json.dumps({"type": "auditAdvisory", "data": {"advisory": {"module_name": "postcss"}}}),
        json.dumps({"type": "auditSummary", "data": {"vulnerabilities": {"info": 0, "low": 8, "moderate": 23, "high": 12, "critical": 0}}})
    ]
    passed, report = evaluate_frontend_audit_lines(lines)
    assert passed is False
    assert "[POLICY FAILURE] High advisories (12) exceeds baseline (9)" in report


def test_frontend_audit_failure_critical_vulnerability():
    """Fails immediately if any critical vulnerability is found."""
    lines = [
        json.dumps({"type": "auditAdvisory", "data": {"advisory": {"module_name": "ws"}}}),
        json.dumps({"type": "auditSummary", "data": {"vulnerabilities": {"info": 0, "low": 0, "moderate": 0, "high": 0, "critical": 1}}})
    ]
    passed, report = evaluate_frontend_audit_lines(lines)
    assert passed is False
    assert "[POLICY FAILURE] Critical vulnerability detected" in report


def test_frontend_audit_failure_new_unapproved_package():
    """Fails if a newly introduced unapproved package is flagged."""
    lines = [
        json.dumps({"type": "auditAdvisory", "data": {"advisory": {"module_name": "unapproved-frontend-lib"}}}),
        json.dumps({"type": "auditSummary", "data": {"vulnerabilities": {"info": 0, "low": 1, "moderate": 0, "high": 0, "critical": 0}}})
    ]
    passed, report = evaluate_frontend_audit_lines(lines)
    assert passed is False
    assert "[POLICY FAILURE] Newly introduced unapproved vulnerable packages detected" in report
