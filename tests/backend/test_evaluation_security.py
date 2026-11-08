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
    assert any(c['id'] == 'auth_separation' and c['status'] == 'Verified' for c in data['controls'])
    assert any(c['id'] == 'tenant_isolation' and c['status'] == 'Verified' for c in data['controls'])
    assert any(c['id'] == 'file_integrity' and c['status'] == 'Verified' for c in data['controls'])
    assert any(c['id'] == 'frontend_deps' and c['status'] == 'Needs attention' for c in data['controls'])
    assert any(c['id'] == 'hosted_verification' and c['status'] == 'Not verified' for c in data['controls'])

