"""Verification Script for Deployed METECHQ Frontend & API Security Headers

Validates presence AND specific policy values across:
1. Deployed Frontend Pages (HTML/SPA)
2. Frontend Same-Origin /api/ Reverse Proxy Route
3. Direct Render Origin API

Exits with code 1 if any check fails or is pending deployment.
Exits with code 0 ONLY when all expected headers and values match on live endpoints.
"""
import argparse
import ssl
import sys
import urllib.request

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

def verify_frontend_html(url: str) -> tuple:
    """Verifies security headers on frontend HTML/SPA routes."""
    errors = []
    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={"User-Agent": "METECHQ-Security-Auditor/1.0"})
    print(f"\n[1] Verifying Frontend HTML Route: {url}")

    try:
        with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
            status = resp.status
            headers = {k.lower(): v for k, v in resp.headers.items()}
    except Exception as e:
        return False, [f"Request failed: {e}"]

    if status != 200:
        errors.append(f"Expected HTTP 200, got HTTP {status}")

    # 1. HSTS
    hsts = headers.get("strict-transport-security", "")
    if not hsts:
        errors.append("Strict-Transport-Security header is MISSING")
    elif "max-age=" not in hsts:
        errors.append(f"Strict-Transport-Security invalid: '{hsts}'")
    else:
        print(f"  [+] Strict-Transport-Security: {hsts}")

    # 2. X-Content-Type-Options
    cto = headers.get("x-content-type-options", "")
    if cto != "nosniff":
        errors.append(f"X-Content-Type-Options expected 'nosniff', got '{cto}'")
    else:
        print(f"  [+] X-Content-Type-Options: {cto}")

    # 3. X-Frame-Options
    xfo = headers.get("x-frame-options", "")
    if xfo != "DENY":
        errors.append(f"X-Frame-Options expected 'DENY', got '{xfo}'")
    else:
        print(f"  [+] X-Frame-Options: {xfo}")

    # 4. Referrer-Policy
    ref = headers.get("referrer-policy", "")
    if ref != "strict-origin-when-cross-origin":
        errors.append(f"Referrer-Policy expected 'strict-origin-when-cross-origin', got '{ref or 'MISSING'}'")
    else:
        print(f"  [+] Referrer-Policy: {ref}")

    # 5. Permissions-Policy
    pp = headers.get("permissions-policy", "")
    if not pp or "camera=()" not in pp or "microphone=()" not in pp or "geolocation=()" not in pp:
        errors.append(f"Permissions-Policy expected camera/mic/geo restrictions, got '{pp or 'MISSING'}'")
    else:
        print(f"  [+] Permissions-Policy: {pp}")

    # 6. Content-Security-Policy
    csp = headers.get("content-security-policy", "")
    if not csp:
        errors.append("Content-Security-Policy header is MISSING")
    else:
        print(f"  [+] Content-Security-Policy present ({len(csp)} chars)")
        # Check required directives
        for req_dir in ["default-src 'self'", "script-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"]:
            if req_dir not in csp:
                errors.append(f"CSP missing required directive '{req_dir}'")

        # Check tightened boundaries (no broad wildcards)
        if "connect-src 'self' https: https://metechq.onrender.com" in csp:
            errors.append("CSP connect-src still includes obsolete broad 'https:' wildcard (pending latest deployment)")
        if "img-src 'self' data: blob: https:;" in csp:
            errors.append("CSP img-src still includes broad 'https:' wildcard (pending latest deployment)")

    return len(errors) == 0, errors


def verify_frontend_api_proxy(url: str) -> tuple:
    """Verifies the frontend same-origin /api/ rewrite routes to Render backend."""
    errors = []
    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={"User-Agent": "METECHQ-Security-Auditor/1.0"})
    print(f"\n[2] Verifying Frontend /api/ Reverse Proxy: {url}")

    try:
        with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
            status = resp.status
            headers = {k.lower(): v for k, v in resp.headers.items()}
    except Exception as e:
        return False, [f"Proxy request failed: {e}"]

    if status != 200:
        errors.append(f"Expected HTTP 200, got HTTP {status}")

    origin_server = headers.get("x-render-origin-server", "")
    if origin_server != "uvicorn":
        errors.append(f"X-Render-Origin-Server expected 'uvicorn', got '{origin_server or 'MISSING'}' (proxy route not reaching Render container)")
    else:
        print(f"  [+] X-Render-Origin-Server: {origin_server} (Vercel rewrite active)")

    ref = headers.get("referrer-policy", "")
    if ref != "strict-origin-when-cross-origin":
        errors.append(f"Proxy Referrer-Policy expected 'strict-origin-when-cross-origin', got '{ref or 'MISSING'}'")
    else:
        print(f"  [+] Proxy Referrer-Policy: {ref}")

    return len(errors) == 0, errors


def verify_render_direct_api(url: str) -> tuple:
    """Verifies direct Render FastAPI container response headers."""
    errors = []
    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={"User-Agent": "METECHQ-Security-Auditor/1.0"})
    print(f"\n[3] Verifying Direct Render Backend API: {url}")

    try:
        with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
            status = resp.status
            headers = {k.lower(): v for k, v in resp.headers.items()}
    except Exception as e:
        return False, [f"Backend request failed: {e}"]

    if status != 200:
        errors.append(f"Expected HTTP 200, got HTTP {status}")

    cto = headers.get("x-content-type-options", "")
    if cto != "nosniff":
        errors.append(f"Backend X-Content-Type-Options expected 'nosniff', got '{cto}'")
    else:
        print(f"  [+] Backend X-Content-Type-Options: {cto}")

    xfo = headers.get("x-frame-options", "")
    if xfo not in ("DENY", "SAMEORIGIN"):
        errors.append(f"Backend X-Frame-Options expected DENY or SAMEORIGIN, got '{xfo}'")
    else:
        print(f"  [+] Backend X-Frame-Options: {xfo}")

    ref = headers.get("referrer-policy", "")
    if ref != "strict-origin-when-cross-origin":
        errors.append(f"Backend Referrer-Policy expected 'strict-origin-when-cross-origin', got '{ref or 'MISSING'}'")
    else:
        print(f"  [+] Backend Referrer-Policy: {ref}")

    return len(errors) == 0, errors


def main():
    parser = argparse.ArgumentParser(description="Verify live hosted security headers against policy.")
    parser.add_argument("--frontend", default="https://frontend-iota-mauve-57.vercel.app/")
    parser.add_argument("--backend", default="https://metechq.onrender.com/api/")
    args = parser.parse_args()

    print("=" * 65)
    print("METECHQ HOSTED SECURITY HEADERS VERIFICATION & POLICY VALIDATION")
    print("=" * 65)

    all_passed = True
    all_errors = []

    # 1. Frontend Homepage
    ok, errs = verify_frontend_html(args.frontend)
    if not ok:
        all_passed = False
        all_errors.extend([f"Homepage: {e}" for e in errs])

    # 2. Frontend Security Route
    sec_url = args.frontend.rstrip("/") + "/security"
    ok, errs = verify_frontend_html(sec_url)
    if not ok:
        all_passed = False
        all_errors.extend([f"/security: {e}" for e in errs])

    # 3. Frontend Same-Origin /api/ Reverse Proxy
    proxy_url = args.frontend.rstrip("/") + "/api/"
    ok, errs = verify_frontend_api_proxy(proxy_url)
    if not ok:
        all_passed = False
        all_errors.extend([f"Proxy /api/: {e}" for e in errs])

    # 4. Direct Render Backend API
    ok, errs = verify_render_direct_api(args.backend)
    if not ok:
        all_passed = False
        all_errors.extend([f"Direct API: {e}" for e in errs])

    print("\n" + "=" * 65)
    print("HOSTED VERIFICATION SUMMARY")
    print("=" * 65)
    if all_passed:
        print("✅ SUCCESS: All live hosted endpoints match defined security header policy.")
        return 0
    else:
        print("⚠️ STATUS: PENDING DEPLOYMENT / DISCREPANCIES DETECTED:")
        for err in all_errors:
            print(f"  [-] {err}")
        print("\nNote: Vercel edge caches prior deployment headers until commit is redeployed.")
        print("To resolve: Trigger a redeploy in the Vercel dashboard from latest main commit.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
