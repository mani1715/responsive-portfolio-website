"""Run the evaluation suites against a fresh, disposable local database.
Never uses the application's existing DB_NAME or stored account credentials.
"""
import os
from pathlib import Path
import secrets
import socket
import subprocess
import sys
import tempfile
import time
import uuid

import requests
from pymongo import MongoClient

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).resolve().parents[1]

def main():
    run_id = uuid.uuid4().hex
    db_name = 'metechq_evaluation_test_' + run_id
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    env = os.environ.copy()
    password = 'Eval!' + secrets.token_urlsafe(24) + '7Aa'
    env.update(ENVIRONMENT='test', DB_NAME=db_name, MONGODB_URI='mongodb://127.0.0.1:27017',
               MONGO_URL='mongodb://127.0.0.1:27017', JWT_SECRET_KEY=secrets.token_urlsafe(48),
               CLIENT_JWT_SECRET=secrets.token_urlsafe(48), INIT_SUPERADMIN_USERNAME='evaluation_admin',
               INIT_SUPERADMIN_PASSWORD=password, ADMIN_USERNAME='evaluation_admin', ADMIN_PASSWORD=password,
               BACKEND_URL=f'http://127.0.0.1:{port}/api', PYTHONPATH=str(ROOT/'backend'), PYTHONUTF8='1',
               REDIS_URL='', TRUST_PROXY='false', CORS_ORIGINS='http://127.0.0.1:3001')
    reports = ROOT/'docs'/'verification'
    reports.mkdir(parents=True, exist_ok=True)
    result = 1
    with tempfile.TemporaryDirectory(prefix='metechq-evaluation-') as directory:
        env['UPLOAD_DIR'] = directory
        with (reports/'backend-server.log').open('w',encoding='utf-8') as log:
            server = subprocess.Popen([sys.executable,'-m','uvicorn','server:app','--host','127.0.0.1','--port',str(port)],cwd=ROOT/'backend',env=env,stdout=log,stderr=log)
            try:
                for _ in range(60):
                    if server.poll() is not None:
                        raise RuntimeError('Test API exited; inspect docs/verification/backend-server.log')
                    try:
                        if requests.get(env['BACKEND_URL']+'/',timeout=1).status_code == 200:
                            break
                    except requests.RequestException:
                        pass
                    time.sleep(.5)
                else:
                    raise RuntimeError('Test API did not become ready')
                commands = [
                    [sys.executable,'-m','pytest','tests/backend/test_comprehensive_security.py','tests/backend/test_evaluation_security.py','tests/backend/test_check_dependency_audits.py','-q','--junitxml='+str(reports/'backend-tests.xml')],
                    [sys.executable,'tests/backend/backend_test.py'],
                    [sys.executable,'tests/backend/client_management_test.py'],
                ]
                result = 0
                with (reports/'backend-results.txt').open('w',encoding='utf-8') as output:
                    for command in commands:
                        completed = subprocess.run(command,cwd=ROOT,env=env,text=True,encoding='utf-8',errors='replace',stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=240)
                        print(completed.stdout,flush=True)
                        output.write(completed.stdout+'\n')
                        if completed.returncode: result = 1
            finally:
                server.terminate()
                try: server.wait(timeout=10)
                except subprocess.TimeoutExpired: server.kill(); server.wait()
                # This exact random database was created only for this run.
                with MongoClient('mongodb://127.0.0.1:27017',serverSelectionTimeoutMS=3000) as mongo:
                    if db_name.startswith('metechq_evaluation_test_') and db_name.endswith(run_id):
                        mongo.drop_database(db_name)
    return result

if __name__ == '__main__':
    sys.exit(main())
