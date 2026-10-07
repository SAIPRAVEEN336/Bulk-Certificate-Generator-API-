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

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Use a temporary database for test isolation
temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ["CERTIFICATE_DB_PATH"] = temp_db.name

from app.main import app
from app.database import init_db

# Initialize clean test schema
init_db(temp_db.name)

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_db():
    """Ensure database tables exist for each test."""
    init_db(temp_db.name)
    yield


class TestBulkCertificateGenerator:
    """Test suite covering all required functionality."""

    def test_create_generation_job_success(self):
        """1. Test creating a valid bulk certificate generation job."""
        payload = {
            "title": "Full-Stack System Architecture Masterclass",
            "issuer_name": "Apex Engineering Institute",
            "issuer_title": "Chief Academic Officer",
            "issue_date": "2026-10-07",
            "recipients": [
                {
                    "recipient_name": "Alice Johnson",
                    "recipient_email": "alice@example.com",
                    "identifier": "APX-001",
                    "custom_notes": "Honors Distinction"
                },
                {
                    "recipient_name": "Bob Smith",
                    "recipient_email": "bob@example.com",
                    "identifier": "APX-002"
                }
            ]
        }

        response = client.post("/api/jobs?sync=true", json=payload)
        assert response.status_code == 202
        data = response.json()
        assert "job_id" in data
        assert data["total_recipients"] == 2
        assert "status_url" in data
        assert "download_zip_url" in data

    def test_input_validation_empty_recipients_list(self):
        """2a. Test input validation: Empty recipients list should be rejected."""
        payload = {
            "title": "Machine Learning Fundamentals",
            "issuer_name": "AI Academy",
            "issuer_title": "Director",
            "issue_date": "2026-10-07",
            "recipients": []  # Empty list violates min_length=1
        }
        response = client.post("/api/jobs", json=payload)
        assert response.status_code == 422
        errors = response.json()["detail"]
        assert any("recipients" in str(err["loc"]) for err in errors)

    def test_input_validation_invalid_email(self):
        """2b. Test input validation: Malformed recipient email should be rejected."""
        payload = {
            "title": "DevOps Intensive",
            "issuer_name": "Cloud Institute",
            "issuer_title": "Lead Instructor",
            "issue_date": "2026-10-07",
            "recipients": [
                {
                    "recipient_name": "Charlie Brown",
                    "recipient_email": "not-a-valid-email-address",
                }
            ]
        }
        response = client.post("/api/jobs", json=payload)
        assert response.status_code == 422
        errors = response.json()["detail"]
        assert any("recipient_email" in str(err["loc"]) or "email" in str(err["msg"]).lower() for err in errors)

    def test_input_validation_empty_recipient_name(self):
        """2c. Test input validation: Whitespace-only name should be rejected."""
        payload = {
            "title": "Cybersecurity Foundations",
            "issuer_name": "SecOps Lab",
            "issuer_title": "Director",
            "issue_date": "2026-10-07",
            "recipients": [
                {
                    "recipient_name": "   ",
                    "recipient_email": "david@example.com",
                }
            ]
        }
        response = client.post("/api/jobs", json=payload)
        assert response.status_code == 422

    def test_input_validation_missing_required_fields(self):
        """2d. Test input validation: Missing title or issuer should fail."""
        payload = {
            # Missing "title"
            "issuer_name": "SecOps Lab",
            "issue_date": "2026-10-07",
            "recipients": [
                {"recipient_name": "David Miller", "recipient_email": "david@example.com"}
            ]
        }
        response = client.post("/api/jobs", json=payload)
        assert response.status_code == 422

    def test_certificate_generation_and_pdf_integrity(self):
        """3. Test certificate generation produces valid PDF bytes."""
        payload = {
            "title": "High-Performance Computing Workshop",
            "issuer_name": "Tech Academy",
            "issuer_title": "Dean of Science",
            "issue_date": "2026-10-07",
            "recipients": [
                {"recipient_name": "Elena Rostova", "recipient_email": "elena@example.com"}
            ]
        }
        create_resp = client.post("/api/jobs?sync=true", json=payload)
        job_id = create_resp.json()["job_id"]

        # Check job detail
        status_resp = client.get(f"/api/jobs/{job_id}")
        assert status_resp.status_code == 200
        detail = status_resp.json()
        assert detail["status"] == "COMPLETED"
        assert len(detail["recipients"]) == 1

        cert = detail["recipients"][0]
        assert cert["status"] == "COMPLETED"
        assert cert["file_size"] > 1000  # ReportLab PDF is typically 3KB - 20KB
        assert cert["verification_code"].startswith("CERT-")

    def test_job_status_and_progress_tracking(self):
        """4. Test job status and progress metrics calculation."""
        payload = {
            "title": "Quantum Computing 101",
            "issuer_name": "Physics Institute",
            "issuer_title": "Research Director",
            "issue_date": "2026-10-07",
            "recipients": [
                {"recipient_name": "Fiona Gallagher", "recipient_email": "fiona@example.com"},
                {"recipient_name": "George Clark", "recipient_email": "george@example.com"}
            ]
        }
        create_resp = client.post("/api/jobs?sync=true", json=payload)
        job_id = create_resp.json()["job_id"]

        status_resp = client.get(f"/api/jobs/{job_id}")
        assert status_resp.status_code == 200
        data = status_resp.json()
        assert data["total_recipients"] == 2
        assert data["completed_count"] == 2
        assert data["failed_count"] == 0
        assert data["progress_percentage"] == 100.0

    def test_handling_individual_certificate_failure(self):
        """5. Test that a failure on one recipient DOES NOT stop valid certificates in the batch."""
        payload = {
            "title": "Cloud Native Architecture",
            "issuer_name": "Cloud Academy",
            "issuer_title": "Lead Architect",
            "issue_date": "2026-10-07",
            "recipients": [
                # Valid recipient 1
                {"recipient_name": "Valid Recipient One", "recipient_email": "valid1@example.com"},
                # Failing recipient (simulated trigger: fail_test)
                {"recipient_name": "Bad Recipient", "recipient_email": "fail_test@example.com"},
                # Valid recipient 2 (must be generated despite prior failure!)
                {"recipient_name": "Valid Recipient Two", "recipient_email": "valid2@example.com"}
            ]
        }
        create_resp = client.post("/api/jobs?sync=true", json=payload)
        job_id = create_resp.json()["job_id"]

        status_resp = client.get(f"/api/jobs/{job_id}")
        assert status_resp.status_code == 200
        data = status_resp.json()

        # Job overall status should reflect PARTIAL_SUCCESS
        assert data["status"] == "PARTIAL_SUCCESS"
        assert data["total_recipients"] == 3
        assert data["completed_count"] == 2
        assert data["failed_count"] == 1

        # Check individual recipient statuses
        recipients = data["recipients"]
        completed = [r for r in recipients if r["status"] == "COMPLETED"]
        failed = [r for r in recipients if r["status"] == "FAILED"]

        assert len(completed) == 2
        assert len(failed) == 1
        assert "Simulated failure trigger" in failed[0]["error_message"]
        assert completed[0]["download_url"] is not None

    def test_retrieve_generated_certificate_pdf(self):
        """6a. Test retrieving/downloading an individual generated certificate PDF."""
        payload = {
            "title": "Distributed Systems",
            "issuer_name": "Tech Org",
            "issuer_title": "CTO",
            "issue_date": "2026-10-07",
            "recipients": [
                {"recipient_name": "Hannah Abbott", "recipient_email": "hannah@example.com"}
            ]
        }
        create_resp = client.post("/api/jobs?sync=true", json=payload)
        job_id = create_resp.json()["job_id"]
        job_detail = client.get(f"/api/jobs/{job_id}").json()
        cert_id = job_detail["recipients"][0]["id"]

        # Download PDF
        download_resp = client.get(f"/api/certificates/{cert_id}/download")
        assert download_resp.status_code == 200
        assert download_resp.headers["content-type"] == "application/pdf"
        # Verify valid PDF signature
        assert download_resp.content.startswith(b"%PDF-")

    def test_retrieve_generated_certificates_zip(self):
        """6b. Test retrieving all certificates as a single bulk ZIP archive."""
        payload = {
            "title": "Agile Leadership",
            "issuer_name": "Project Institute",
            "issuer_title": "Agile Coach",
            "issue_date": "2026-10-07",
            "recipients": [
                {"recipient_name": "Ian Wright", "recipient_email": "ian@example.com"},
                {"recipient_name": "Julia Roberts", "recipient_email": "julia@example.com"}
            ]
        }
        create_resp = client.post("/api/jobs?sync=true", json=payload)
        job_id = create_resp.json()["job_id"]

        zip_resp = client.get(f"/api/jobs/{job_id}/download-zip")
        assert zip_resp.status_code == 200
        assert zip_resp.headers["content-type"] == "application/zip"
        # Verify valid ZIP magic bytes: PK\x03\x04
        assert zip_resp.content.startswith(b"PK\x03\x04")

    def test_retrieve_nonexistent_job_returns_404(self):
        """7. Test retrieving an unknown job returns 404."""
        resp = client.get("/api/jobs/non-existent-job-uuid-12345")
        assert resp.status_code == 404

    def test_list_jobs_endpoint(self):
        """8. Test listing jobs returns pagination metadata."""
        resp = client.get("/api/jobs?page=1&limit=5")
        assert resp.status_code == 200
        data = resp.json()
        assert "jobs" in data
        assert "total" in data
        assert "page" in data
        assert data["limit"] == 5
