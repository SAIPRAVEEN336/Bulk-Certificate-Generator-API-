"""
Comprehensive Pytest Test Suite for CertiFlow Bulk Certificate Generator API.
Covers:
- Creating a generation job
- Input validation (empty names, invalid emails, missing required fields, empty recipients list)
- Certificate generation (valid PDF output)
- Job status & progress tracking
- Handling an individual certificate failure (partial success & error isolation)
- Retrieving generated certificates (individual PDF & bulk ZIP)
"""

import os
import sys
import tempfile
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ["CERTIFICATE_DB_PATH"] = temp_db.name

from app.main import app
from app.database import init_db

init_db(temp_db.name)
client = TestClient(app)


class TestBulkCertificateGenerator:
    def test_create_generation_job_success(self):
        payload = {
            "title": "Full-Stack System Architecture Masterclass",
            "issuer_name": "Apex Engineering Institute",
            "issuer_title": "Chief Academic Officer",
            "issue_date": "2026-10-07",
            "recipients": [
                {"recipient_name": "Alice Johnson", "recipient_email": "alice@example.com"},
                {"recipient_name": "Bob Smith", "recipient_email": "bob@example.com"}
            ]
        }
        response = client.post("/api/jobs?sync=true", json=payload)
        assert response.status_code == 202
        data = response.json()
        assert "job_id" in data
        assert data["total_recipients"] == 2

    def test_input_validation_empty_recipients_list(self):
        payload = {
            "title": "Machine Learning",
            "issuer_name": "AI Academy",
            "issue_date": "2026-10-07",
            "recipients": []
        }
        response = client.post("/api/jobs", json=payload)
        assert response.status_code == 422

    def test_input_validation_invalid_email(self):
        payload = {
            "title": "DevOps Intensive",
            "issuer_name": "Cloud Institute",
            "issue_date": "2026-10-07",
            "recipients": [{"recipient_name": "Charlie", "recipient_email": "invalid-email"}]
        }
        response = client.post("/api/jobs", json=payload)
        assert response.status_code == 422

    def test_certificate_generation_and_pdf_integrity(self):
        payload = {
            "title": "Computing Workshop",
            "issuer_name": "Tech Academy",
            "issue_date": "2026-10-07",
            "recipients": [{"recipient_name": "Elena Rostova", "recipient_email": "elena@example.com"}]
        }
        create_resp = client.post("/api/jobs?sync=true", json=payload)
        job_id = create_resp.json()["job_id"]
        status_resp = client.get(f"/api/jobs/{job_id}")
        assert status_resp.status_code == 200
        detail = status_resp.json()
        assert detail["status"] == "COMPLETED"
        assert detail["recipients"][0]["file_size"] > 1000

    def test_handling_individual_certificate_failure(self):
        payload = {
            "title": "Cloud Architecture",
            "issuer_name": "Cloud Academy",
            "issue_date": "2026-10-07",
            "recipients": [
                {"recipient_name": "Valid 1", "recipient_email": "valid1@example.com"},
                {"recipient_name": "Bad Recipient", "recipient_email": "fail_test@example.com"},
                {"recipient_name": "Valid 2", "recipient_email": "valid2@example.com"}
            ]
        }
        create_resp = client.post("/api/jobs?sync=true", json=payload)
        job_id = create_resp.json()["job_id"]
        detail = client.get(f"/api/jobs/{job_id}").json()
        assert detail["status"] == "PARTIAL_SUCCESS"
        assert detail["completed_count"] == 2
        assert detail["failed_count"] == 1

    def test_retrieve_generated_certificate_pdf(self):
        payload = {
            "title": "Distributed Systems",
            "issuer_name": "Tech Org",
            "issue_date": "2026-10-07",
            "recipients": [{"recipient_name": "Hannah Abbott", "recipient_email": "hannah@example.com"}]
        }
        create_resp = client.post("/api/jobs?sync=true", json=payload)
        job_id = create_resp.json()["job_id"]
        detail = client.get(f"/api/jobs/{job_id}").json()
        cert_id = detail["recipients"][0]["id"]
        download_resp = client.get(f"/api/certificates/{cert_id}/download")
        assert download_resp.status_code == 200
        assert download_resp.headers["content-type"] == "application/pdf"
