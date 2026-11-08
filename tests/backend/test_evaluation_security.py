"""Regression tests for the evaluation hardening pass; use the isolated runner."""
import io
import os
from pathlib import Path
import sys
from datetime import timedelta
import uuid

import pytest
import requests
from fastapi import HTTPException, UploadFile
from pydantic import ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'backend'))
from auth.jwt import create_access_token, decode_access_token
from utils.file_security import validate_file_security, generate_secure_path
from schemas.project import ProjectCreate

@pytest.mark.parametrize('client', [False, True])
def test_jwt_realm_separation(client):
    token = create_access_token({'id':'regression-user','type':'client' if client else 'admin'})
    assert decode_access_token(token, is_client=client)
    assert decode_access_token(token, is_client=not client) is None

def test_expired_jwt_rejected():
    token = create_access_token({'id':'expired'}, expires_delta=timedelta(seconds=-5))
    assert decode_access_token(token) is None

@pytest.mark.parametrize('name,data', [
    ('late.svg', b'<svg>'+b' '*1024+b'<script>alert(1)</script></svg>'),
    ('payload.exe', b'MZexample'), ('fake.png', b'<html>payload</html>'),
    ('fake.webp', b'not an image'), ('fake.ico', b'not an icon'), ('empty.txt', b''),
])
def test_unsafe_uploads_rejected(name,data):
    with pytest.raises(HTTPException): validate_file_security(UploadFile(filename=name,file=io.BytesIO(data)))

@pytest.mark.parametrize('header',[b'GIF87a',b'GIF89a'])
def test_both_gif_signatures_accepted(header):
    assert validate_file_security(UploadFile(filename='image.gif',file=io.BytesIO(header+b'example')))[0] == '.gif'

def test_upload_size_limit():
    with pytest.raises(HTTPException) as error:
        validate_file_security(UploadFile(filename='large.txt',file=io.BytesIO(b'12345')),max_size=4)
    assert error.value.status_code == 413

def test_generated_upload_path_confined(tmp_path):
    _, path = generate_secure_path(tmp_path, '.pdf')
    assert path.is_relative_to(tmp_path)
    with pytest.raises(HTTPException): generate_secure_path(tmp_path, '/../../outside.txt')

@pytest.mark.parametrize('url',['javascript:alert(1)','data:text/html,test','//evil.example','https://user:pass@example.com','https://example.com\\@evil.example'])
def test_project_unsafe_links_rejected(url):
    with pytest.raises(ValidationError):
        ProjectCreate(title='Test',category='Web',description='Test project',image_url='https://example.com/image.png',live_demo_url=url)

@pytest.mark.parametrize('url',['https://example.com/project','/demo/ecommerce'])
def test_project_deployed_links_accepted(url):
    assert ProjectCreate(title='Test',category='Web',description='Test project',image_url='/image.png',live_demo_url=url).live_demo_url == url

@pytest.fixture(scope='module')
def api_context():
    if not os.getenv('DB_NAME','').startswith('metechq_evaluation_test_'):
        pytest.skip('Requires scripts/run_evaluation_tests.py isolated database')
    base = os.environ['BACKEND_URL']
    response = requests.post(base+'/admins/login',json={'username':os.environ['ADMIN_USERNAME'],'password':os.environ['ADMIN_PASSWORD']},timeout=15)
    assert response.status_code == 200
    admin = {'Authorization':'Bearer '+(response.json().get('token') or response.json()['access_token'])}
    clients=[]
    password='Evaluation!Client123'
    for i in range(2):
        email=f'qa-{uuid.uuid4().hex}@example.com'
        response=requests.post(base+'/admin/clients/',headers=admin,json={'name':f'Evaluation client {i}','email':email,'password':password},timeout=15)
        assert response.status_code == 200, response.text
        client=response.json()
        login=requests.post(base+'/client/auth/login',json={'email':email,'password':password},timeout=15)
        assert login.status_code == 200
        clients.append((client,{'Authorization':'Bearer '+login.json()['access_token']}))
    response=requests.post(base+'/admin/client-projects/',headers=admin,json={'name':'Evaluation workspace','client_id':clients[0][0]['id'],'progress':25,'status':'in_progress'},timeout=15)
    assert response.status_code == 200, response.text
    yield base,admin,clients,response.json()['id']


def test_client_project_isolation(api_context):
    base,admin,clients,project=api_context
    owner,other=clients[0][1],clients[1][1]
    assert requests.get(base+'/client/projects/'+project,headers=owner,timeout=15).status_code == 200
    assert requests.get(base+'/client/projects/'+project,headers=other,timeout=15).status_code == 404
    assert requests.post(base+'/client/projects/'+project+'/comments',headers=other,json={'message':'Unauthorized'},timeout=15).status_code == 404
    assert requests.post(base+'/client/projects/'+project+'/chat',headers=other,json={'message':'Unauthorized'},timeout=15).status_code == 404
    assert requests.get(base+'/client/projects/'+project+'/files/nonexistent/download',headers=other,timeout=15).status_code == 404
    assert requests.get(base+'/admin/clients/',headers=owner,timeout=15).status_code == 401
    assert requests.get(base+'/client/projects/',headers=admin,timeout=15).status_code == 401


def test_client_workspace_comments_chat_and_files(api_context):
    base,admin,clients,project=api_context
    owner=clients[0][1]
    assert requests.post(base+'/client/projects/'+project+'/comments',headers=owner,json={'message':'Evaluation comment'},timeout=15).status_code == 200
    assert requests.post(base+'/client/projects/'+project+'/chat',headers=owner,json={'message':'Evaluation message'},timeout=15).status_code == 200
    chat=requests.get(base+'/client/projects/'+project+'/chat',headers=owner,timeout=15)
    assert any(message['message']=='Evaluation message' for message in chat.json())
    upload=requests.post(base+'/admin/client-projects/'+project+'/files',headers=admin,files={'file':('brief.txt',b'Evaluation project brief','text/plain')},timeout=15)
    assert upload.status_code == 200,upload.text
    file_id=upload.json()['id']
    download=requests.get(base+f'/client/projects/{project}/files/{file_id}/download',headers=owner,timeout=15)
    assert download.status_code == 200
    assert download.content == b'Evaluation project brief'


def test_public_portfolio_pagination_and_private_exclusion(api_context):
    base,admin,_,_=api_context
    ids=[]
    for private in [False,False,True]:
        response=requests.post(base+'/projects/',headers=admin,json={'title':'Evaluation '+uuid.uuid4().hex,'category':'Web','description':'Regression project','image_url':'https://example.com/image.png','live_demo_url':'https://example.com','is_private':private,'gallery_images':['https://example.com/detail.png']},timeout=15)
        assert response.status_code == 200,response.text
        ids.append(response.json()['id'])
    first=requests.get(base+'/projects/',params={'offset':0,'limit':1},timeout=15).json()
    second=requests.get(base+'/projects/',params={'offset':1,'limit':1},timeout=15).json()
    assert len(first)==len(second)==1 and first[0]['id']!=second[0]['id']
    public=requests.get(base+'/projects/',timeout=15).json()
    assert ids[2] not in [p['id'] for p in public]
    assert requests.get(base+'/projects/'+ids[2],timeout=15).status_code==404
    assert requests.get(base+'/projects/'+ids[2],headers=admin,timeout=15).status_code==200
    assert requests.get(base+'/projects/',params={'limit':101},timeout=15).status_code==422


def test_cors_rejects_untrusted_origin(api_context):
    base,_,_,_=api_context
    response=requests.options(base+'/projects/',headers={'Origin':'https://untrusted.example','Access-Control-Request-Method':'GET'},timeout=15)
    assert response.headers.get('Access-Control-Allow-Origin') != 'https://untrusted.example'

def test_restricted_admin_cannot_manage_clients_or_portfolio(api_context):
    base,admin,_,_=api_context
    username='limited_'+uuid.uuid4().hex[:10]
    password='Limited!Evaluation123'
    created=requests.post(base+'/admins/create',headers=admin,json={'username':username,'password':password,'role':'admin','permissions':{'canManageClients':False,'canManagePortfolio':False}},timeout=15)
    assert created.status_code == 200,created.text
    login=requests.post(base+'/admins/login',json={'username':username,'password':password},timeout=15)
    assert login.status_code == 200
    headers={'Authorization':'Bearer '+(login.json().get('token') or login.json()['access_token'])}
    assert requests.get(base+'/admin/clients/',headers=headers,timeout=15).status_code==403
    assert requests.get(base+'/projects/all',headers=headers,timeout=15).status_code==403
    assert requests.get(base+'/admins/list',headers=headers,timeout=15).status_code==403

def test_public_admin_bootstrap_disabled(api_context):
    base,_,_,_=api_context
    assert requests.post(base+'/admins/init',timeout=15).status_code == 410

def test_admin_security_overview_requires_authentication(api_context):
    base,admin,clients,_ = api_context
    # 1. Unauthenticated request must be rejected with 401
    assert requests.get(base+'/admins/security-overview', timeout=15).status_code == 401
    
    # 2. Client token must be rejected with 401/403 (realm separation)
    client_auth = clients[0][1]
    assert requests.get(base+'/admins/security-overview', headers=client_auth, timeout=15).status_code in [401, 403]
    
    # 3. Super admin token must succeed and return verified status
    response = requests.get(base+'/admins/security-overview', headers=admin, timeout=15)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data['status'] == 'active'
    assert 'controls' in data
    assert any(c['id'] == 'auth_separation' and c['status'] == 'Verified' and c['is_live_check'] is True for c in data['controls'])
    assert any(c['id'] == 'tenant_isolation' and c['status'] == 'Verified' and c['is_live_check'] is False and c['last_verified'] is None for c in data['controls'])
    assert any(c['id'] == 'file_integrity' and c['status'] == 'Verified' and c['is_live_check'] is False and c['last_verified'] is None for c in data['controls'])
    assert any(c['id'] == 'frontend_deps' and c['status'] == 'Needs attention' and c['is_live_check'] is False for c in data['controls'])
    assert any(c['id'] == 'hosted_verification' and c['status'] == 'Not verified' for c in data['controls'])
    assert 'audit_chain' in data
    assert 'records_scanned' in data['audit_chain']
    assert 'legacy_records_skipped' in data['audit_chain']
    assert 'fully_verified_collection' in data['audit_chain']

# ==============================================================================
# AUDIT CHAIN INTEGRITY & BOUNDARY TESTS
# ==============================================================================

class _MockCursor:
    def __init__(self, data):
        self._data = list(data)
    def sort(self, key, direction):
        self._data.sort(key=lambda d: (d.get(key) is not None, d.get(key, 0)), reverse=(direction == -1))
        return self
    def limit(self, n):
        self._data = self._data[:n]
        return self
    async def to_list(self, length=None):
        return self._data[:length] if length is not None else self._data

class _MockAuditCollection:
    def __init__(self, docs=None):
        self.docs = list(docs or [])
    async def count_documents(self, query):
        return len(self.docs)
    def find(self, query=None):
        return _MockCursor(self.docs)

@pytest.mark.asyncio
async def test_audit_chain_empty_log(monkeypatch):
    from utils.audit_logger import verify_audit_log_chain
    import utils.audit_logger as al

    mock_coll = _MockAuditCollection([])
    monkeypatch.setattr(al, "audit_collection", mock_coll)

    res = await verify_audit_log_chain(limit=10)
    assert res["verified"] is True
    assert res["chain_intact"] is True
    assert res["status"] == "empty"
    assert res["total_records_in_db"] == 0
    assert res["records_verified"] == 0
    assert res["complete_scan"] is True
    assert res["is_truncated"] is False
    assert "security_boundary" in res

@pytest.mark.asyncio
async def test_audit_chain_intact_and_tampered(monkeypatch):
    from utils.audit_logger import compute_entry_hash, verify_audit_log_chain, GENESIS_HASH
    import utils.audit_logger as al

    h1 = compute_entry_hash(1, "2026-11-08T10:00:00", "admin1", "Admin", "admin", "login", "auth", "", "127.0.0.1", "success", GENESIS_HASH, {})
    e1 = {"sequence": 1, "timestamp": "2026-11-08T10:00:00", "actor_id": "admin1", "actor_name": "Admin", "actor_role": "admin", "action": "login", "resource_type": "auth", "resource_id": "", "ip_address": "127.0.0.1", "status": "success", "prev_hash": GENESIS_HASH, "entry_hash": h1, "details": {}}
    h2 = compute_entry_hash(2, "2026-11-08T10:01:00", "admin1", "Admin", "admin", "update", "setting", "1", "127.0.0.1", "success", h1, {"k": "v"})
    e2 = {"sequence": 2, "timestamp": "2026-11-08T10:01:00", "actor_id": "admin1", "actor_name": "Admin", "actor_role": "admin", "action": "update", "resource_type": "setting", "resource_id": "1", "ip_address": "127.0.0.1", "status": "success", "prev_hash": h1, "entry_hash": h2, "details": {"k": "v"}}

    # Intact chain
    mock_coll = _MockAuditCollection([e1, e2])
    monkeypatch.setattr(al, "audit_collection", mock_coll)
    res = await verify_audit_log_chain(limit=10)
    assert res["verified"] is True
    assert res["status"] == "verified"
    assert res["records_verified"] == 2
    assert res["total_records_in_db"] == 2
    assert res["complete_scan"] is True

    # Tampered chain (modified details in sequence 2)
    e2_tampered = dict(e2)
    e2_tampered["details"] = {"k": "tampered_value"}
    mock_coll_tampered = _MockAuditCollection([e1, e2_tampered])
    monkeypatch.setattr(al, "audit_collection", mock_coll_tampered)
    res_tampered = await verify_audit_log_chain(limit=10)
    assert res_tampered["verified"] is False
    assert res_tampered["status"] == "tampered"
    assert res_tampered["broken_sequence"] == 2
    assert "Tampering detected" in res_tampered["error"]

@pytest.mark.asyncio
async def test_audit_chain_sequence_gap(monkeypatch):
    from utils.audit_logger import compute_entry_hash, verify_audit_log_chain, GENESIS_HASH
    import utils.audit_logger as al

    h1 = compute_entry_hash(1, "2026-11-08T10:00:00", "admin1", "Admin", "admin", "login", "auth", "", "127.0.0.1", "success", GENESIS_HASH, {})
    e1 = {"sequence": 1, "timestamp": "2026-11-08T10:00:00", "actor_id": "admin1", "actor_name": "Admin", "actor_role": "admin", "action": "login", "resource_type": "auth", "resource_id": "", "ip_address": "127.0.0.1", "status": "success", "prev_hash": GENESIS_HASH, "entry_hash": h1, "details": {}}
    h2 = compute_entry_hash(2, "2026-11-08T10:01:00", "admin1", "Admin", "admin", "update", "setting", "1", "127.0.0.1", "success", h1, {})
    h3 = compute_entry_hash(3, "2026-11-08T10:02:00", "admin1", "Admin", "admin", "logout", "auth", "", "127.0.0.1", "success", h2, {})
    e3 = {"sequence": 3, "timestamp": "2026-11-08T10:02:00", "actor_id": "admin1", "actor_name": "Admin", "actor_role": "admin", "action": "logout", "resource_type": "auth", "resource_id": "", "ip_address": "127.0.0.1", "status": "success", "prev_hash": h2, "entry_hash": h3, "details": {}}

    # Sequence 2 omitted -> sequence gap
    mock_coll = _MockAuditCollection([e1, e3])
    monkeypatch.setattr(al, "audit_collection", mock_coll)
    res = await verify_audit_log_chain(limit=10)
    assert res["verified"] is False
    assert res["status"] == "sequence_gap"
    assert res["broken_sequence"] == 3
    assert "Sequence gap detected" in res["error"]

@pytest.mark.asyncio
async def test_audit_chain_exceeds_limit_never_reports_complete(monkeypatch):
    from utils.audit_logger import compute_entry_hash, verify_audit_log_chain, GENESIS_HASH
    import utils.audit_logger as al

    docs = []
    prev = GENESIS_HASH
    for i in range(1, 6):
        h = compute_entry_hash(i, f"2026-11-08T10:0{i}:00", "admin1", "Admin", "admin", "action", "auth", "", "127.0.0.1", "success", prev, {})
        docs.append({"sequence": i, "timestamp": f"2026-11-08T10:0{i}:00", "actor_id": "admin1", "actor_name": "Admin", "actor_role": "admin", "action": "action", "resource_type": "auth", "resource_id": "", "ip_address": "127.0.0.1", "status": "success", "prev_hash": prev, "entry_hash": h, "details": {}})
        prev = h

    mock_coll = _MockAuditCollection(docs)
    monkeypatch.setattr(al, "audit_collection", mock_coll)

    # Calling with limit=3 when 5 records exist
    res = await verify_audit_log_chain(limit=3)
    assert res["verified"] is True
    assert res["is_truncated"] is True
    assert res["complete_scan"] is False
    assert res["status"] == "partial_verified"
    assert res["records_verified"] == 3
    assert res["total_records_in_db"] == 5
    assert "Partial audit scan" in res["message"]

@pytest.mark.asyncio
async def test_audit_chain_legacy_entries_and_midchain_detection(monkeypatch):
    from utils.audit_logger import compute_entry_hash, verify_audit_log_chain, GENESIS_HASH
    import utils.audit_logger as al

    legacy = {"timestamp": "2026-11-07T00:00:00", "action": "legacy_seed"}
    h1 = compute_entry_hash(1, "2026-11-08T10:00:00", "admin1", "Admin", "admin", "login", "auth", "", "127.0.0.1", "success", GENESIS_HASH, {})
    e1 = {"sequence": 1, "timestamp": "2026-11-08T10:00:00", "actor_id": "admin1", "actor_name": "Admin", "actor_role": "admin", "action": "login", "resource_type": "auth", "resource_id": "", "ip_address": "127.0.0.1", "status": "success", "prev_hash": GENESIS_HASH, "entry_hash": h1, "details": {}}

    # Pre-sequence legacy entry should be skipped
    mock_coll = _MockAuditCollection([legacy, e1])
    monkeypatch.setattr(al, "audit_collection", mock_coll)
    res = await verify_audit_log_chain(limit=10)
    assert res["verified"] is True
    assert res["legacy_records_skipped"] == 1
    assert res["records_verified"] == 1

    # Unchained record inserted AFTER sequence 1 started -> detected as tampering
    unchained_mid = {"sequence": 2, "timestamp": "2026-11-08T10:05:00", "action": "untracked_insertion"}
    mock_coll_mid = _MockAuditCollection([e1, unchained_mid])
    monkeypatch.setattr(al, "audit_collection", mock_coll_mid)
    res_mid = await verify_audit_log_chain(limit=10)
    assert res_mid["verified"] is False
    assert res_mid["status"] == "tampered"
    assert "Unchained legacy entry" in res_mid["error"]

@pytest.mark.asyncio
async def test_audit_chain_mixed_legacy_collection_cannot_show_fully_verified(monkeypatch):
    """
    Asserts that a collection containing pre-chaining legacy records followed by a valid
    hash chain cannot show fully verified (fully_verified_collection must be False,
    legacy_records_skipped > 0, and status indicates mixed legacy chain).
    """
    from utils.audit_logger import compute_entry_hash, verify_audit_log_chain, GENESIS_HASH
    import utils.audit_logger as al

    legacy1 = {"timestamp": "2026-11-07T00:00:00", "action": "legacy_seed_record"}
    h1 = compute_entry_hash(1, "2026-11-08T10:00:00", "admin1", "Admin", "admin", "login", "auth", "", "127.0.0.1", "success", GENESIS_HASH, {})
    e1 = {"sequence": 1, "timestamp": "2026-11-08T10:00:00", "actor_id": "admin1", "actor_name": "Admin", "actor_role": "admin", "action": "login", "resource_type": "auth", "resource_id": "", "ip_address": "127.0.0.1", "status": "success", "prev_hash": GENESIS_HASH, "entry_hash": h1, "details": {}}
    h2 = compute_entry_hash(2, "2026-11-08T10:01:00", "admin1", "Admin", "admin", "update", "setting", "1", "127.0.0.1", "success", h1, {"setting": "theme"})
    e2 = {"sequence": 2, "timestamp": "2026-11-08T10:01:00", "actor_id": "admin1", "actor_name": "Admin", "actor_role": "admin", "action": "update", "resource_type": "setting", "resource_id": "1", "ip_address": "127.0.0.1", "status": "success", "prev_hash": h1, "entry_hash": h2, "details": {"setting": "theme"}}

    mock_coll = _MockAuditCollection([legacy1, e1, e2])
    monkeypatch.setattr(al, "audit_collection", mock_coll)

    res = await verify_audit_log_chain(limit=10)

    # 1. Scanned metrics
    assert res["records_scanned"] == 3
    assert res["total_records_in_db"] == 3
    assert res["records_verified"] == 2
    assert res["legacy_records_skipped"] == 1
    assert res["complete_scan"] is True  # all 3 records in collection were scanned

    # 2. Critical assertion: CANNOT show fully verified
    assert res["fully_verified_collection"] is False
    assert res["status"] == "legacy_mixed_chain"
    assert "Collection cannot be labeled fully verified" in res["message"]


def test_hybrid_rate_limiter_configured_and_failure_behavior(monkeypatch):
    """
    Verifies HybridRateLimiter under all three operating states:
    1. Unconfigured REDIS_URL -> in_memory_unconfigured (not labeled distributed).
    2. Configured REDIS_URL with live Redis -> distributed_redis (is_distributed=True).
    3. Unreachable / failing Redis -> degraded_in_memory_fallback (graceful in-memory fallback, never labeled distributed).
    """
    from utils.rate_limiter import HybridRateLimiter
    from unittest.mock import MagicMock

    # State 1: Unconfigured REDIS_URL
    limiter_none = HybridRateLimiter(redis_url="")
    assert limiter_none.is_distributed is False
    assert limiter_none.status == "in_memory_unconfigured"

    # State 2: Configured live Redis (mocked)
    mock_redis_module = MagicMock()
    mock_client = MagicMock()
    mock_script = MagicMock()

    mock_client.ping.return_value = True
    mock_client.register_script.return_value = mock_script
    mock_redis_module.Redis.from_url.return_value = mock_client
    monkeypatch.setattr("utils.rate_limiter.redis", mock_redis_module, raising=False)
    import sys
    monkeypatch.setitem(sys.modules, "redis", mock_redis_module)

    # First call via Lua script returns allowed [1, 0]
    mock_script.return_value = [1, 0]
    limiter_redis = HybridRateLimiter(redis_url="redis://mock-redis.internal:6379/0")
    assert limiter_redis.is_distributed is True
    assert limiter_redis.status == "distributed_redis"

    allowed, retry = limiter_redis.check_and_record("worker_key_1", max_attempts=5, window_seconds=60)
    assert allowed is True
    assert retry == 0

    # Second call returns blocked [0, 42]
    mock_script.return_value = [0, 42]
    allowed, retry = limiter_redis.check_and_record("worker_key_1", max_attempts=5, window_seconds=60)
    assert allowed is False
    assert retry == 42

    # State 3: Runtime Redis outage during active operation
    mock_script.side_effect = Exception("Connection closed by peer")
    allowed, retry = limiter_redis.check_and_record("worker_key_fallback", max_attempts=2, window_seconds=60)
    # Must gracefully fall back to in-memory, update status, and remain functional
    assert limiter_redis.is_distributed is False
    assert limiter_redis.status == "degraded_in_memory_fallback"
    assert "Connection closed" in limiter_redis.last_error
    assert allowed is True  # First in-memory attempt allowed
