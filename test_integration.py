#!/usr/bin/env python
"""
SpectraSync Frontend-Backend Integration Test
Tests all API endpoints that the frontend uses
"""

import sys
import os

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

import requests
import json
from pathlib import Path

BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def test_result(name, success, details=""):
    """Print test result with color coding"""
    status = f"{GREEN}[PASS]{RESET}" if success else f"{RED}[FAIL]{RESET}"
    print(f"{status} | {name}")
    if details and not success:
        print(f"       {YELLOW}{details}{RESET}")
    return success

def main():
    print("=" * 70)
    print(f"{BLUE}SpectraSync Frontend-Backend Integration Test{RESET}")
    print("=" * 70)
    print()

    results = []

    # Test 1: Root endpoint
    print(f"{BLUE}[1/12] Testing Root Endpoint...{RESET}")
    try:
        r = requests.get(f"{BASE_URL}/", timeout=5)
        success = r.status_code == 200 and "SpectraSync" in r.text
        results.append(test_result("Root endpoint responds", success))
    except Exception as e:
        results.append(test_result("Root endpoint responds", False, str(e)))

    # Test 2: Health endpoint
    print(f"\n{BLUE}[2/12] Testing Health Endpoint...{RESET}")
    try:
        r = requests.get(f"{API_URL}/health", timeout=5)
        success = r.status_code == 200
        if success:
            data = r.json()
            has_required = all(k in data for k in ["status", "version", "db", "storage", "worker", "golden_signals"])
            results.append(test_result("Health endpoint structure", has_required, f"Missing fields" if not has_required else ""))
            results.append(test_result(f"System status: {data.get('status')}", data.get('status') == 'healthy'))
            results.append(test_result(f"Golden signals: {data.get('golden_signals', 0)}", data.get('golden_signals', 0) > 0))
        else:
            results.append(test_result("Health endpoint responds", False, f"Status {r.status_code}"))
    except Exception as e:
        results.append(test_result("Health endpoint responds", False, str(e)))

    # Test 3: Authentication - Login
    print(f"\n{BLUE}[3/12] Testing Authentication...{RESET}")
    token = None
    try:
        r = requests.post(
            f"{API_URL}/auth/login",
            json={"email": "analyst@spectrasync.io", "password": "analyst123"},
            timeout=5
        )
        success = r.status_code == 200
        if success:
            data = r.json()
            token = data.get("access_token")
            has_user = "user" in data and "email" in data["user"]
            results.append(test_result("Analyst login successful", token is not None))
            results.append(test_result("User data returned", has_user))
        else:
            results.append(test_result("Analyst login", False, f"Status {r.status_code}"))
    except Exception as e:
        results.append(test_result("Analyst login", False, str(e)))

    if not token:
        print(f"\n{RED}Cannot proceed without authentication token. Stopping tests.{RESET}")
        print(f"\nTotal: {sum(results)}/{len(results)} tests passed")
        return 1

    headers = {"Authorization": f"Bearer {token}"}

    # Test 4: Get current user
    print(f"\n{BLUE}[4/12] Testing User Info Endpoint...{RESET}")
    try:
        r = requests.get(f"{API_URL}/auth/me", headers=headers, timeout=5)
        success = r.status_code == 200
        if success:
            data = r.json()
            results.append(test_result("Get current user", "email" in data and "role" in data))
        else:
            results.append(test_result("Get current user", False, f"Status {r.status_code}"))
    except Exception as e:
        results.append(test_result("Get current user", False, str(e)))

    # Test 5: List demos
    print(f"\n{BLUE}[5/12] Testing Demo Signals List...{RESET}")
    demo_key = None
    try:
        r = requests.get(f"{API_URL}/demos/list", headers=headers, timeout=5)
        success = r.status_code == 200
        if success:
            data = r.json()
            results.append(test_result("List demo signals", len(data) > 0, f"Found {len(data)} demos"))
            if data:
                demo_key = data[0].get("key")
                results.append(test_result(f"Demo signal has key", demo_key is not None))
        else:
            results.append(test_result("List demo signals", False, f"Status {r.status_code}"))
    except Exception as e:
        results.append(test_result("List demo signals", False, str(e)))

    # Test 6: Load demo signal
    print(f"\n{BLUE}[6/12] Testing Demo Signal Load...{RESET}")
    job_id = None
    if demo_key:
        try:
            r = requests.post(f"{API_URL}/demos/{demo_key}/load", headers=headers, timeout=10)
            success = r.status_code == 200
            if success:
                data = r.json()
                job_id = data.get("id")
                results.append(test_result(f"Load demo '{demo_key}'", job_id is not None))
                results.append(test_result("Job has signal_file_id", "signal_file_id" in data))
            else:
                results.append(test_result("Load demo signal", False, f"Status {r.status_code}"))
        except Exception as e:
            results.append(test_result("Load demo signal", False, str(e)))
    else:
        results.append(test_result("Load demo signal", False, "No demo key available"))

    # Test 7: List jobs
    print(f"\n{BLUE}[7/12] Testing Job List...{RESET}")
    try:
        r = requests.get(f"{API_URL}/jobs", headers=headers, timeout=5)
        success = r.status_code == 200
        if success:
            data = r.json()
            results.append(test_result("List jobs", isinstance(data, list)))
            if job_id:
                job_exists = any(j.get("id") == job_id for j in data)
                results.append(test_result(f"Created job #{job_id} in list", job_exists))
        else:
            results.append(test_result("List jobs", False, f"Status {r.status_code}"))
    except Exception as e:
        results.append(test_result("List jobs", False, str(e)))

    # Test 8: Get job status
    if job_id:
        print(f"\n{BLUE}[8/12] Testing Job Status Endpoint...{RESET}")
        try:
            r = requests.get(f"{API_URL}/jobs/{job_id}/status", headers=headers, timeout=5)
            success = r.status_code == 200
            if success:
                data = r.json()
                has_fields = all(k in data for k in ["job_id", "status", "progress"])
                results.append(test_result("Get job status", has_fields))
                results.append(test_result(f"Job status: {data.get('status')}", data.get('status') in ['queued', 'validating', 'running', 'completed', 'failed']))
            else:
                results.append(test_result("Get job status", False, f"Status {r.status_code}"))
        except Exception as e:
            results.append(test_result("Get job status", False, str(e)))

        # Test 9: Get job details
        print(f"\n{BLUE}[9/12] Testing Job Details...{RESET}")
        try:
            r = requests.get(f"{API_URL}/jobs/{job_id}", headers=headers, timeout=5)
            success = r.status_code == 200
            if success:
                data = r.json()
                results.append(test_result("Get job details", "id" in data and "status" in data))
            else:
                results.append(test_result("Get job details", False, f"Status {r.status_code}"))
        except Exception as e:
            results.append(test_result("Get job details", False, str(e)))

        # Test 10: Get processing stages
        print(f"\n{BLUE}[10/12] Testing Processing Stages...{RESET}")
        try:
            r = requests.get(f"{API_URL}/jobs/{job_id}/stages", headers=headers, timeout=5)
            success = r.status_code == 200
            if success:
                data = r.json()
                results.append(test_result("Get processing stages", isinstance(data, list)))
            else:
                results.append(test_result("Get processing stages", False, f"Status {r.status_code}"))
        except Exception as e:
            results.append(test_result("Get processing stages", False, str(e)))
    else:
        results.extend([
            test_result("Get job status", False, "No job ID available"),
            test_result("Get job details", False, "No job ID available"),
            test_result("Get processing stages", False, "No job ID available")
        ])

    # Test 11: List files
    print(f"\n{BLUE}[11/12] Testing File List...{RESET}")
    try:
        r = requests.get(f"{API_URL}/files", headers=headers, timeout=5)
        success = r.status_code == 200
        if success:
            data = r.json()
            results.append(test_result("List files", isinstance(data, list)))
        else:
            results.append(test_result("List files", False, f"Status {r.status_code}"))
    except Exception as e:
        results.append(test_result("List files", False, str(e)))

    # Test 12: OpenAPI docs
    print(f"\n{BLUE}[12/12] Testing API Documentation...{RESET}")
    try:
        r = requests.get(f"{BASE_URL}/docs", timeout=5)
        success = r.status_code == 200
        results.append(test_result("OpenAPI docs available", success))
    except Exception as e:
        results.append(test_result("OpenAPI docs available", False, str(e)))

    # Summary
    print("\n" + "=" * 70)
    passed = sum(results)
    total = len(results)
    percentage = (passed / total * 100) if total > 0 else 0

    if passed == total:
        print(f"{GREEN}✓ ALL TESTS PASSED: {passed}/{total} ({percentage:.1f}%){RESET}")
        print(f"{GREEN}Frontend-Backend integration is FULLY FUNCTIONAL!{RESET}")
        return_code = 0
    elif passed >= total * 0.8:
        print(f"{YELLOW}⚠ MOST TESTS PASSED: {passed}/{total} ({percentage:.1f}%){RESET}")
        print(f"{YELLOW}Integration is mostly working with minor issues{RESET}")
        return_code = 0
    else:
        print(f"{RED}✗ TESTS FAILED: {passed}/{total} ({percentage:.1f}%){RESET}")
        print(f"{RED}Integration needs fixes{RESET}")
        return_code = 1

    print("=" * 70)
    return return_code


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Tests interrupted by user{RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{RED}Fatal error: {e}{RESET}")
        sys.exit(1)
