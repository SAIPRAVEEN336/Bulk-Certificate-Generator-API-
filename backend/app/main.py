"""
Main FastAPI Application for Bulk Certificate Generation.
Provides RESTful endpoints for job submission, status tracking, certificate retrieval,
and system diagnostics.
"""

import os
import subprocess
import zipfile
from typing import Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response

from app.database import init_db, get_db_connection, DB_PATH
from app.schemas import (
    BulkCertificateCreateRequest,
    JobCreatedResponse,
    JobDetailResponse,
    JobSummaryResponse,
    JobListResponse,
    CertificateItemResponse,
)
from app.service import (
    create_certificate_job,
    process_generation_job,
    get_job_summary,
    get_job_detail,
    ZIPS_DIR,
    CERTIFICATES_DIR,
)
from app.generator import generate_svg_certificate

# Initialize tables on startup
init_db()

app = FastAPI(
    title="CertiFlow - Bulk Certificate Generator API",
    description="High-throughput bulk certificate generator with relational persistence, background processing, and fault tolerance.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    """Health check and relational database status."""
    with get_db_connection() as conn:
        job_count = conn.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]
        cert_count = conn.execute("SELECT COUNT(*) FROM certificates").fetchone()[0]

    return {
        "status": "healthy",
        "service": "CertiFlow Bulk Certificate Generator",
        "database": "SQLite (Relational, WAL enabled)",
        "database_path": DB_PATH,
        "total_jobs_stored": job_count,
        "total_certificates_stored": cert_count,
    }


@app.post("/api/jobs", response_model=JobCreatedResponse, status_code=202)
def submit_bulk_certificate_job(
    request: BulkCertificateCreateRequest,
    background_tasks: BackgroundTasks,
    sync: bool = Query(False, description="Process synchronously (for deterministic test suites)")
):
    """
    Submit a bulk certificate generation job.
    Validates input schema and starts asynchronous background generation.
    Returns 202 Accepted with tracking endpoints.
    """
    job_info = create_certificate_job(request)
    job_id = job_info["job_id"]

    if sync:
        # Run synchronously for unit tests or immediate requirement
        process_generation_job(job_id)
    else:
        # Run asynchronously in background worker
        background_tasks.add_task(process_generation_job, job_id)

    return JobCreatedResponse(
        job_id=job_id,
        status="QUEUED" if not sync else "COMPLETED",
        message=f"Job accepted for {job_info['total_recipients']} recipient(s). Generation started.",
        total_recipients=job_info["total_recipients"],
        status_url=f"/api/jobs/{job_id}",
        download_zip_url=f"/api/jobs/{job_id}/download-zip",
    )


@app.get("/api/jobs", response_model=JobListResponse)
def list_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status (QUEUED, PROCESSING, COMPLETED, PARTIAL_SUCCESS, FAILED)"),
):
    """Retrieve list of all certificate generation jobs with pagination."""
    offset = (page - 1) * limit

    with get_db_connection() as conn:
        query = "SELECT * FROM jobs"
        params = []
        if status:
            query += " WHERE status = ?"
            params.append(status.upper())

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = conn.execute(query, params).fetchall()

        count_query = "SELECT COUNT(*) FROM jobs"
        count_params = []
        if status:
            count_query += " WHERE status = ?"
            count_params.append(status.upper())
        total_jobs = conn.execute(count_query, count_params).fetchone()[0]

    job_summaries = []
    for r in rows:
        total = r["total_recipients"]
        comp = r["completed_count"]
        fail = r["failed_count"]
        pct = 0.0 if total == 0 else round(((comp + fail) / total) * 100, 1)

        job_summaries.append(
            JobSummaryResponse(
                id=r["id"],
                title=r["title"],
                issuer_name=r["issuer_name"],
                issuer_title=r["issuer_title"],
                issue_date=r["issue_date"],
                template_name=r["template_name"],
                status=r["status"],
                total_recipients=total,
                completed_count=comp,
                failed_count=fail,
                progress_percentage=pct,
                created_at=r["created_at"],
                updated_at=r["updated_at"],
                download_zip_url=f"/api/jobs/{r['id']}/download-zip" if comp > 0 else None,
            )
        )

    return JobListResponse(
        jobs=job_summaries,
        total=total_jobs,
        page=page,
        limit=limit,
    )


@app.get("/api/jobs/{job_id}", response_model=JobDetailResponse)
def get_job_status(job_id: str):
    """
    Check the current progress and detailed results of a generation job.
    Includes overall status, counts, and per-recipient progress and error details.
    """
    detail = get_job_detail(job_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    return detail


@app.get("/api/jobs/{job_id}/download-zip")
def download_job_certificates_zip(job_id: str):
    """
    Download a ZIP archive containing all successfully generated certificates in the job.
    """
    with get_db_connection() as conn:
        job = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not job:
            raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")

        certs = conn.execute(
            "SELECT * FROM certificates WHERE job_id = ? AND status = 'COMPLETED'",
            (job_id,),
        ).fetchall()

    if not certs:
        raise HTTPException(
            status_code=400,
            detail=f"Job '{job_id}' has no completed certificates ready for download yet (status: {job['status']})",
        )

    zip_path = os.path.join(ZIPS_DIR, f"{job_id}.zip")

    # Rebuild if not present or freshly updated
    if not os.path.exists(zip_path):
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for c in certs:
                if c["file_path"] and os.path.exists(c["file_path"]):
                    safe_name = "".join(ch for ch in c["recipient_name"] if ch.isalnum() or ch in (" ", "-", "_")).strip()
                    arcname = f"Certificate_{safe_name}_{c['verification_code']}.pdf"
                    zipf.write(c["file_path"], arcname=arcname)

    safe_title = "".join(ch for ch in job["title"] if ch.isalnum() or ch in (" ", "_", "-")).strip()
    download_filename = f"Certificates_{safe_title}_{job_id[:8]}.zip"

    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=download_filename,
    )


@app.get("/api/certificates/{certificate_id}/download")
def download_certificate(certificate_id: str):
    """
    Retrieve and download an individual generated PDF certificate.
    """
    with get_db_connection() as conn:
        cert = conn.execute("SELECT * FROM certificates WHERE id = ?", (certificate_id,)).fetchone()

    if not cert:
        raise HTTPException(status_code=404, detail=f"Certificate '{certificate_id}' not found")

    if cert["status"] != "COMPLETED":
        raise HTTPException(
            status_code=400,
            detail=f"Certificate is not ready for download. Current status: {cert['status']}. Error: {cert['error_message'] or 'None'}",
        )

    file_path = cert["file_path"]
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Certificate PDF file is missing from storage disk")

    safe_name = "".join(ch for ch in cert["recipient_name"] if ch.isalnum() or ch in (" ", "-", "_")).strip()
    download_filename = f"Certificate_{safe_name}_{cert['verification_code']}.pdf"

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=download_filename,
    )


@app.get("/api/certificates/{certificate_id}/preview")
def preview_certificate(certificate_id: str):
    """
    Retrieve high-fidelity SVG preview for in-browser rendering.
    """
    with get_db_connection() as conn:
        row = conn.execute(
            """
            SELECT c.*, j.title, j.issuer_name, j.issuer_title, j.issue_date
            FROM certificates c
            JOIN jobs j ON c.job_id = j.id
            WHERE c.id = ?
            """,
            (certificate_id,),
        ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Certificate not found")

    svg_content = generate_svg_certificate(
        recipient_name=row["recipient_name"],
        course_title=row["title"],
        issuer_name=row["issuer_name"],
        issuer_title=row["issuer_title"],
        issue_date=row["issue_date"],
        verification_code=row["verification_code"],
        identifier=row["identifier"],
        custom_notes=row["custom_notes"],
    )

    return Response(content=svg_content, media_type="image/svg+xml")


@app.get("/api/template/preview")
def get_template_sample_preview():
    """Returns sample SVG preview of the predefined template."""
    svg_content = generate_svg_certificate(
        recipient_name="Alexandria M. Vance",
        course_title="Advanced Distributed Systems & High-Throughput Engineering",
        issuer_name="Global Institute of Technology",
        issuer_title="Head of Engineering Academics",
        issue_date="October 7, 2026",
        verification_code="CERT-EXMP-2026",
        identifier="STUDENT-9941",
        custom_notes="First Class Distinction",
    )
    return Response(content=svg_content, media_type="image/svg+xml")


@app.post("/api/tests/run")
def run_tests():
    """
    Execute pytest on the test suite and return real output and exit code.
    Enables one-click live verification directly from the UI!
    """
    tests_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "tests")
    try:
        proc = subprocess.run(
            ["pytest", "-v", "--tb=short", tests_dir],
            capture_output=True,
            text=True,
            timeout=30,
        )
        return {
            "success": proc.returncode == 0,
            "exit_code": proc.returncode,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
        }
    except Exception as e:
        return {
            "success": False,
            "exit_code": 1,
            "stdout": "",
            "stderr": str(e),
        }
