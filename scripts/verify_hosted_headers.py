"""Verification Script for Deployed METECHQ Frontend & API Security Headers

Tests live response headers against defined policy.
Never assumes or fakes live verification.
"""
import argparse
import ssl
import sys
import urllib.request

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

REQUIRED_SECURITY_HEADERS = [
    "content-security-policy",
    "strict-transport-security",
    "x-content-type-options",
    "x-frame-options",
    "referrer-policy",
    "permissions-policy"
]

def check_endpoint(url: str, is_frontend: bool = True):
    print(f"\n--- Checking: {url} ---")
    ctx = ssl.create_default_context()
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "METECHQ-Security-Auditor/1.0"}
    )
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
            print(f"Status: {resp.status} {resp.reason}")
            headers = {k.lower(): v for k, v in resp.headers.items()}

            found = {}
            for h in REQUIRED_SECURITY_HEADERS:
                if h in headers:
                    found[h] = headers[h]
                    print(f"  [+] {h}: {headers[h]}")
                else:
                    print(f"  [-] {h}: MISSING")

            if "server" in headers:
                print(f"  [*] server: {headers['server']}")
            if "x-render-origin-server" in headers:
                print(f"  [*] x-render-origin-server: {headers['x-render-origin-server']}")

            # Check CSP details
            csp = headers.get("content-security-policy", "")
            if csp:
                if "https:" in csp.split(";")[0]:  # checking broad default-src
                    print("  [!] Notice: CSP default-src includes broad https: wildcard")
                else:
                    print("  [+] CSP present")

            return resp.status, found
    except Exception as e:
        print(f"[-] Request failed: {e}")
        return None, {}

def main():
    parser = argparse.ArgumentParser(description="Verify live hosted security headers.")
    parser.add_argument("--frontend", default="https://frontend-iota-mauve-57.vercel.app/")
    parser.add_argument("--backend", default="https://metechq.onrender.com/api/")
    args = parser.parse_args()

    print("=" * 60)
    print("METECHQ HOSTED SECURITY HEADERS VERIFICATION")
    print("=" * 60)

    # 1. Frontend Homepage
    check_endpoint(args.frontend, is_frontend=True)

    # 2. Frontend Security Route
    sec_url = args.frontend.rstrip("/") + "/security"
    check_endpoint(sec_url, is_frontend=True)

    # 3. Frontend API Rewrite Route
    rewrite_url = args.frontend.rstrip("/") + "/api/"
    check_endpoint(rewrite_url, is_frontend=True)

    # 4. Backend Direct API Route
    check_endpoint(args.backend, is_frontend=False)

    print("\n" + "=" * 60)
    print("Verification complete. Compare observed headers with frontend/vercel.json and backend/server.py.")
    print("Note: If Vercel has not yet redeployed the latest commit, latest vercel.json headers will be pending deployment.")

if __name__ == "__main__":
    main()
