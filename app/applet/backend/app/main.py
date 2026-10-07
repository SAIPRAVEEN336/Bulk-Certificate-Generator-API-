"""
Main FastAPI Application for Bulk Certificate Generation.
Provides RESTful endpoints for job submission, status tracking, certificate retrieval,
and system diagnostics.
"""

import os
import zipfile
from typing import Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

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
    ZIPS_DIR,
)

init_db()

app = FastAPI(
    title="CertiFlow - Bulk Certificate Generator API",
    description="High-throughput bulk certificate generator with relational persistence and background processing.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    with get_db_connection() as conn:
        job_count = conn.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]
        cert_count = conn.execute("SELECT COUNT(*) FROM certificates").fetchone()[0]

    return {
        "status": "healthy",
        "service": "CertiFlow Bulk Certificate Generator",
        "database": "SQLite (Relational, WAL enabled)",
        "total_jobs_stored": job_count,
        "total_certificates_stored": cert_count,
    }


@app.post("/api/jobs", response_model=JobCreatedResponse, status_code=202)
def submit_bulk_certificate_job(
    request: BulkCertificateCreateRequest,
    background_tasks: BackgroundTasks,
    sync: bool = Query(False, description="Process synchronously")
):
    job_info = create_certificate_job(request)
    job_id = job_info["job_id"]

    if sync:
        process_generation_job(job_id)
    else:
        background_tasks.add_task(process_generation_job, job_id)

    return JobCreatedResponse(
        job_id=job_id,
        status="QUEUED" if not sync else "COMPLETED",
        message=f"Job accepted for {job_info['total_recipients']} recipient(s). Generation started.",
        total_recipients=job_info["total_recipients"],
        status_url=f"/api/jobs/{job_id}",
        download_zip_url=f"/api/jobs/{job_id}/download-zip",
    )


@app.get("/api/jobs/{job_id}", response_model=JobDetailResponse)
def get_job_status(job_id: str):
    summary = get_job_summary(job_id)
    if not summary:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")

    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM certificates WHERE job_id = ? ORDER BY created_at ASC",
            (job_id,),
        ).fetchall()

        recipients = []
        for r in rows:
            recipients.append(
                CertificateItemResponse(
                    id=r["id"],
                    job_id=r["job_id"],
                    recipient_name=r["recipient_name"],
                    recipient_email=r["recipient_email"],
                    identifier=r["identifier"],
                    custom_notes=r["custom_notes"],
                    status=r["status"],
                    error_message=r["error_message"],
                    verification_code=r["verification_code"],
                    file_size=r["file_size"] or 0,
                    download_url=f"/api/certificates/{r['id']}/download" if r["status"] == "COMPLETED" else None,
                    created_at=r["created_at"],
                    updated_at=r["updated_at"],
                )
            )

    return JobDetailResponse(**summary, recipients=recipients)


@app.get("/api/jobs/{job_id}/download-zip")
def download_job_certificates_zip(job_id: str):
    with get_db_connection() as conn:
        job = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not job:
            raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")

    zip_path = os.path.join(ZIPS_DIR, f"{job_id}.zip")
    if not os.path.exists(zip_path):
        raise HTTPException(status_code=400, detail="ZIP bundle not ready or no completed certificates")

    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=f"Certificates_{job['id'][:8]}.zip",
    )


@app.get("/api/certificates/{certificate_id}/download")
def download_certificate(certificate_id: str):
    with get_db_connection() as conn:
        cert = conn.execute("SELECT * FROM certificates WHERE id = ?", (certificate_id,)).fetchone()

    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    if cert["status"] != "COMPLETED" or not cert["file_path"] or not os.path.exists(cert["file_path"]):
        raise HTTPException(status_code=400, detail="Certificate not completed or file missing")

    return FileResponse(
        path=cert["file_path"],
        media_type="application/pdf",
        filename=f"Certificate_{cert['recipient_name']}_{cert['verification_code']}.pdf",
    )
