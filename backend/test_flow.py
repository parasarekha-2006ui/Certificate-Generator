import os
import io
import json
import zipfile
import urllib.request
import urllib.parse
from datetime import datetime

BASE_URL = "http://127.0.0.1:5000/api"
results = []

def record(test_name, passed, details=""):
    results.append({'test': test_name, 'passed': passed, 'details': details})
    mark = "PASS" if passed else "FAIL"
    print(f"[{mark}] {test_name}: {details}")

def http_json(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except:
            return e.code, {'message': raw}

def run_tests():
    print("=" * 60)
    print("  RUNNING FULL-STACK E2E VERIFICATION SUITE")
    print("=" * 60)

    # 1. Login
    code, res = http_json("/auth/login", method="POST", data={
        "email": "admin@college.edu",
        "password": "Admin@123"
    })
    token = res.get("token")
    record("1. Admin Login", code == 200 and token is not None, f"Status: {code}, Admin: {res.get('admin', {}).get('name')}")
    if not token:
        print("Cannot continue without token.")
        return

    # 2. Add Student
    stu_id = f"STU{datetime.now().strftime('%M%S')}"
    code, res = http_json("/students", method="POST", token=token, data={
        "student_id": stu_id,
        "name": "Aditi Sharma",
        "college": "Apex Institute of Technology",
        "department": "Artificial Intelligence & Data Science",
        "year": "3rd Year",
        "email": "aditi.sharma@example.com",
        "phone": "9876543210"
    })
    student = res.get("student")
    record("2. Add Student", code == 201 and student is not None, f"Student ID: {stu_id}, Name: {student.get('name') if student else 'None'}")

    # 3. Generate Certificate (Single)
    code, res = http_json("/certificates/generate", method="POST", token=token, data={
        "student_db_id": student['id'] if student else None,
        "student_id": stu_id,
        "student_name": "Aditi Sharma",
        "college_name": "Apex Institute of Technology",
        "department": "Artificial Intelligence & Data Science",
        "year": "3rd Year",
        "event_id": 1,
        "event_name": "Annual Tech Symposium & Hackathon 2026",
        "event_date": "2026-03-15",
        "template_key": "hackathon",
        "issue_date": "2026-11-03",
        "issuing_authority": "Prof. Dr. R. K. Sharma, Dean of Academic Affairs"
    })
    cert = res.get("certificate")
    cert_id = cert.get("certificate_id") if cert else None
    record("3. Generate Certificate (Single)", code == 201 and cert_id is not None, f"Generated Certificate ID: {cert_id}")

    # 4. Download PDF
    pdf_req = urllib.request.Request(f"{BASE_URL}/certificates/{cert_id}/download")
    with urllib.request.urlopen(pdf_req) as pdf_resp:
        pdf_bytes = pdf_resp.read()
        is_pdf = pdf_bytes.startswith(b"%PDF")
        record("4. Download Certificate PDF", is_pdf and len(pdf_bytes) > 1000, f"Size: {len(pdf_bytes)} bytes, Header: {pdf_bytes[:4]}")

    # 5. Public Verification (Status == Valid)
    code, res = http_json(f"/verify/{cert_id}", method="GET")
    cert_info = res.get("certificate", {})
    no_leak = ("email" not in cert_info) and ("phone" not in cert_info)
    record("5. Public QR / Web Verification (Status == Valid)", 
           code == 200 and res.get("status") == "Valid" and no_leak, 
           f"Status: {res.get('status')}, Student: {cert_info.get('student_name')}, Privacy Protected: {no_leak}")

    # 6. Revoke Certificate
    code, res = http_json(f"/certificates/{cert_id}/revoke", method="POST", token=token)
    record("6. Revoke Certificate", code == 200 and res.get("status") == "Revoked", f"Revocation message: {res.get('message')}")

    # 7. Public Verification Again (Status == Revoked)
    code, res = http_json(f"/verify/{cert_id}", method="GET")
    record("7. Public Verification Post-Revoke (Status == Revoked)", 
           code == 200 and res.get("status") == "Revoked", 
           f"Verified Status: {res.get('status')}")

    # 8. Bulk Upload with one bad row
    # Create multipart upload with 2 good rows and 1 bad row (invalid email)
    csv_content = (
        "student_id,name,college,department,year,email,phone\n"
        f"BULK{datetime.now().strftime('%S')}1,Vikram Rao,Apex Institute of Technology,CSE,4th Year,vikram.r@example.com,9876543201\n"
        f"BULK{datetime.now().strftime('%S')}2,Neha Gupta,Apex Institute of Technology,ECE,3rd Year,INVALID_EMAIL_ADDRESS,9876543202\n"
        f"BULK{datetime.now().strftime('%S')}3,Deepak Nair,Apex Institute of Technology,IT,2nd Year,deepak.n@example.com,9876543203\n"
    )

    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body_parts = []
    # file part
    body_parts.append(f"--{boundary}\r\n".encode())
    body_parts.append(b'Content-Disposition: form-data; name="file"; filename="test_students.csv"\r\n')
    body_parts.append(b'Content-Type: text/csv\r\n\r\n')
    body_parts.append(csv_content.encode("utf-8"))
    body_parts.append(b'\r\n')

    # other fields
    fields = {
        'event_id': '2',
        'template_key': 'workshop',
        'issue_date': '2026-11-03',
        'issuing_authority': 'Dr. S. Meenakshi'
    }
    for k, v in fields.items():
        body_parts.append(f"--{boundary}\r\n".encode())
        body_parts.append(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode())
        body_parts.append(f"{v}\r\n".encode())
    body_parts.append(f"--{boundary}--\r\n".encode())

    multipart_body = b''.join(body_parts)
    bulk_req = urllib.request.Request(
        f"{BASE_URL}/certificates/bulk",
        data=multipart_body,
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Authorization": f"Bearer {token}"
        },
        method="POST"
    )
    with urllib.request.urlopen(bulk_req) as bulk_resp:
        bulk_res = json.loads(bulk_resp.read().decode())
        valid_cnt = bulk_res.get("valid_count", 0)
        invalid_cnt = bulk_res.get("invalid_count", 0)
        zip_url = bulk_res.get("zip_url")
        invalid_rows = bulk_res.get("invalid_rows", [])

        bad_row_detected = (invalid_cnt == 1 and len(invalid_rows) == 1 and "Invalid email" in invalid_rows[0]['errors'][0])
        record("8. Bulk Upload with 1 Bad Row (Row-level Error Detection)", 
               valid_cnt == 2 and bad_row_detected, 
               f"Valid: {valid_cnt}, Invalid: {invalid_cnt}, Bad Row Error: {invalid_rows[0]['errors'] if invalid_rows else 'None'}")

    # 9. Download ZIP Archive
    zip_req = urllib.request.Request(f"http://127.0.0.1:5000{zip_url}", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(zip_req) as zip_resp:
        zip_bytes = zip_resp.read()
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
            pdf_names = z.namelist()
            record("9. Download Bulk ZIP Archive", len(pdf_names) == 2, f"ZIP contains {len(pdf_names)} PDFs: {pdf_names}")

    print("=" * 60)
    passed_all = all(r['passed'] for r in results)
    print(f"TEST RUN RESULT: {'ALL TESTS PASSED' if passed_all else 'SOME TESTS FAILED'}")
    print("=" * 60)

if __name__ == '__main__':
    run_tests()
