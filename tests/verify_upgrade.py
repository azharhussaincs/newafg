#!/usr/bin/env python3
"""
End-to-End Verification Suite for Enterprise Data Platform Upgrade
Tests both legacy core APIs (Zero Regression) and new Reference Services (Module 1-3).
"""

import sys
import json
import urllib.request
import urllib.error

BACKEND_URL = "http://127.0.0.1:8001"
FRONTEND_URL = "http://127.0.0.1:5173"

class TestColors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def make_request(url: str, method: str = "GET", data: dict = None):
    req = urllib.request.Request(url, method=method)
    req.add_header("User-Agent", "E2E-Verifier/1.0")
    if data is not None:
        json_bytes = json.dumps(data).encode("utf-8")
        req.add_header("Content-Type", "application/json; charset=utf-8")
        req.data = json_bytes

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.status
            content_type = response.headers.get("Content-Type", "")
            body = response.read()
            if "application/json" in content_type:
                return status, json.loads(body.decode("utf-8"))
            return status, body
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        return e.code, body
    except Exception as e:
        return 0, str(e)

def run_tests():
    print(f"\n{TestColors.HEADER}{TestColors.BOLD}{'='*80}")
    print("  ENTERPRISE CIVIL REGISTRY PLATFORM — END-TO-END VERIFICATION SUITE")
    print(f"{'='*80}{TestColors.ENDC}\n")

    total_checks = 0
    passed_checks = 0

    def assert_check(name: str, passed: bool, detail: str = ""):
        nonlocal total_checks, passed_checks
        total_checks += 1
        if passed:
            passed_checks += 1
            print(f"  {TestColors.OKGREEN}[PASS]{TestColors.ENDC} {name} {TestColors.OKCYAN}{detail}{TestColors.ENDC}")
        else:
            print(f"  {TestColors.FAIL}[FAIL]{TestColors.ENDC} {name} {TestColors.WARNING}{detail}{TestColors.ENDC}")

    # ==============================================================================
    # 1. Legacy Core APIs (Zero Regression Guarantee)
    # ==============================================================================
    print(f"{TestColors.BOLD}1. Legacy Core System APIs (Zero Regression Check):{TestColors.ENDC}")
    
    # 1.1 Health
    status, res = make_request(f"{BACKEND_URL}/api/health")
    assert_check(
        "GET /api/health",
        status == 200 and isinstance(res, dict) and res.get("status") == "healthy",
        f"Status: {status} | DB: {res.get('database') if isinstance(res, dict) else 'N/A'}"
    )

    # 1.2 Core Records
    status, res = make_request(f"{BACKEND_URL}/api/records?page=1&page_size=2")
    has_records = status == 200 and isinstance(res, dict) and len(res.get("records", [])) > 0
    total_recs = res.get("total_records", 0) if isinstance(res, dict) else 0
    assert_check(
        "GET /api/records",
        has_records and total_recs > 20000000,
        f"Records returned: {len(res.get('records', []))} | Total Indexed: {total_recs:,}"
    )

    # ==============================================================================
    # 2. Additive Reference Services (Module 1)
    # ==============================================================================
    print(f"\n{TestColors.BOLD}2. Additive Translation & Biometrics Engines:{TestColors.ENDC}")

    # 2.1 Translation Service (Dari to English)
    trans_payload = {
        "text": "جلد 4 قلم انداز سال 1396 ولسوالی موسهی ولایت کابل شماره ثبت 201 صفحه 41",
        "src_lang": "prs_Arab",
        "tgt_lang": "eng_Latn"
    }
    status, res = make_request(f"{BACKEND_URL}/api/translate", method="POST", data=trans_payload)
    trans_ok = status == 200 and isinstance(res, dict) and res.get("success") is True and "Preliminary Ledger" in res.get("translated", "")
    assert_check(
        "POST /api/translate (Dari Lexical/Neural)",
        trans_ok,
        f"Engine: {res.get('engine') if isinstance(res, dict) else 'N/A'} | Translated: \"{res.get('translated', '')[:65]}...\""
    )

    # 2.2 Biometric Facial Vector Search (128D Euclidean Matching)
    bio_payload = {
        "recordId": 1009,
        "topK": 3
    }
    status, res = make_request(f"{BACKEND_URL}/api/biometrics/search", method="POST", data=bio_payload)
    bio_ok = status == 200 and isinstance(res, dict) and res.get("success") is True and len(res.get("matches", [])) > 0
    top_match = res.get("matches", [{}])[0] if isinstance(res, dict) and res.get("matches") else {}
    assert_check(
        "POST /api/biometrics/search (128D Vector Match)",
        bio_ok and top_match.get("confidence") == 100.0,
        f"Total Searched: {res.get('total_searched', 0):,} | Top Match: {top_match.get('name')} ({top_match.get('name_english')}) | Conf: {top_match.get('confidence')}%"
    )

    # 2.3 Biometrics Sample Portraits Endpoint
    status, res = make_request(f"{BACKEND_URL}/api/biometrics/photos")
    photos_ok = status == 200 and isinstance(res, dict) and len(res.get("samples", [])) >= 8
    assert_check(
        "GET /api/biometrics/photos",
        photos_ok,
        f"Available Samples: {len(res.get('samples', []))} portraits indexed"
    )

    # ==============================================================================
    # 3. Additive Registries & Audit (Module 1 & 3)
    # ==============================================================================
    print(f"\n{TestColors.BOLD}3. Specialized Registries & Security Auditing:{TestColors.ENDC}")

    # 3.1 RTP Humanitarian Relief Records
    status, res = make_request(f"{BACKEND_URL}/api/rtp/records?limit=5")
    rtp_ok = status == 200 and isinstance(res, dict) and res.get("success") is True and len(res.get("records", [])) > 0
    assert_check(
        "GET /api/rtp/records (Humanitarian 23-Column Registry)",
        rtp_ok,
        f"Indexed Relief Rows: {res.get('total', 0):,} | First PID: #{res.get('records', [{}])[0].get('pid')}"
    )

    # 3.2 IVP Operator Credentials Audit
    status, res = make_request(f"{BACKEND_URL}/api/ivp/audit?limit=5")
    ivp_ok = status == 200 and isinstance(res, dict) and res.get("success") is True and len(res.get("records", [])) > 0
    assert_check(
        "GET /api/ivp/audit (25-Column Security Ledger)",
        ivp_ok,
        f"Operator Accounts: {res.get('total', 0):,} | Root User: {res.get('records', [{}])[0].get('username')}"
    )

    # 3.3 Multi-Domain National Radar
    status, res = make_request(f"{BACKEND_URL}/api/stats/radar")
    radar_ok = status == 200 and isinstance(res, dict) and res.get("success") is True and "nsia_totals" in res.get("data", {})
    assert_check(
        "GET /api/stats/radar (Cross-Domain Radar)",
        radar_ok,
        f"NSIA: {res.get('data', {}).get('nsia_totals', {}).get('total_citizens', 0):,} citizens | RTP: {res.get('data', {}).get('rtp_totals', {}).get('total_beneficiaries', 0):,} | IVP: {res.get('data', {}).get('ivp_totals', {}).get('total_operators', 0):,}"
    )

    # 3.4 Direct Biography Query Parity
    status, res = make_request(f"{BACKEND_URL}/api/biography?limit=2")
    bio_api_ok = status == 200 and isinstance(res, dict) and res.get("success") is True and len(res.get("records", [])) > 0
    assert_check(
        "GET /api/biography (Reference Search Parity)",
        bio_api_ok,
        f"Records returned: {len(res.get('records', []))} | Total Indexed: {res.get('total', 0):,}"
    )

    # 3.5 Direct Biography Lineage Tree Parity
    status, res = make_request(f"{BACKEND_URL}/api/biography/family?id=1009")
    fam_ok = status == 200 and isinstance(res, dict) and res.get("success") is True and "citizen" in res.get("data", {})
    fam_data = res.get("data", {}) if isinstance(res, dict) else {}
    assert_check(
        "GET /api/biography/family?id=1009 (Lineage Tree)",
        fam_ok and len(fam_data.get("siblings", [])) > 0,
        f"Citizen: {fam_data.get('citizen', {}).get('name')} | Siblings: {len(fam_data.get('siblings', []))} | Household: {len(fam_data.get('householdPage', []))}"
    )

    # ==============================================================================
    # 4. Frontend Static Image Assets & Navigation Parity
    # ==============================================================================
    print(f"\n{TestColors.BOLD}4. Frontend Static Image Assets & Proxied Gateway:{TestColors.ENDC}")

    # 4.1 Afghanistan Map PNG
    status, res = make_request(f"{FRONTEND_URL}/afghanistan-map.png")
    assert_check(
        "GET http://localhost:5173/afghanistan-map.png",
        status == 200 and len(res) > 1000000,
        f"Status: {status} | Size: {len(res) / (1024*1024):.2f} MB"
    )

    # 4.2 Kochi Leaks PNG
    status, res = make_request(f"{FRONTEND_URL}/kochi-leaks.png")
    assert_check(
        "GET http://localhost:5173/kochi-leaks.png",
        status == 200 and len(res) > 1000000,
        f"Status: {status} | Size: {len(res) / (1024*1024):.2f} MB"
    )

    # 4.3 Proxied Photo Stream
    status, res = make_request(f"{FRONTEND_URL}/api/biometrics/photos?name=portrait_sample_1009.jpg")
    assert_check(
        "GET http://localhost:5173/api/biometrics/photos?name=portrait_sample_1009.jpg",
        status == 200 and b"<svg" in res,
        f"Status: {status} | Rendered SVG Vector Portrait"
    )

    # ==============================================================================
    # Summary
    # ==============================================================================
    print(f"\n{TestColors.HEADER}{TestColors.BOLD}{'='*80}")
    pass_rate = (passed_checks / total_checks) * 100
    color = TestColors.OKGREEN if pass_rate == 100 else TestColors.FAIL
    print(f"  VERIFICATION RESULT: {color}{passed_checks}/{total_checks} CHECKS PASSED ({pass_rate:.1f}%){TestColors.ENDC}")
    print(f"{TestColors.HEADER}{TestColors.BOLD}{'='*80}{TestColors.ENDC}\n")

    return 0 if passed_checks == total_checks else 1

if __name__ == "__main__":
    sys.exit(run_tests())
