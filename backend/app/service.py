"""
Job processing service and background worker.
Ensures graceful error isolation so single recipient failures never abort the batch.
Atomic updates keep database and file storage consistent.
"""

import os
import uuid
import zipfile
import traceback
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.database import get_db_connection, DB_DIR
from app.generator import generate_pdf_certificate, generate_verification_code
from app.schemas import BulkCertificateCreateRequest

CERTIFICATES_DIR = os.path.join(DB_DIR, "generated_certificates")
ZIPS_DIR = os.path.join(DB_DIR, "zips")
os.makedirs(CERTIFICATES_DIR, exist_ok=True)
os.makedirs(ZIPS_DIR, exist_ok=True)


def get_current_iso_time() -> str:
    return datetime.now(timezone.utc).isoformat()


def create_certificate_job(request: BulkCertificateCreateRequest) -> Dict[str, Any]:
    """
    Persist new job and recipient records to the relational database.
    Initially marked as QUEUED with each certificate in PENDING state.
    """
    job_id = str(uuid.uuid4())
    now = get_current_iso_time()
    total = len(request.recipients)

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Insert parent Job record
        cursor.execute(
            """
            INSERT INTO jobs (
                id, title, issuer_name, issuer_title, issue_date,
                template_name, status, total_recipients,
                completed_count, failed_count, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
            """,
            (
                job_id,
                request.title,
                request.issuer_name,
                request.issuer_title,
                request.issue_date,
                request.template_name or "standard_landscape",
                "QUEUED",
                total,
                now,
                now,
            ),
        )

        # Insert recipient Certificate records
        for idx, recipient in enumerate(request.recipients):
            cert_id = str(uuid.uuid4())
            verification_code = generate_verification_code(recipient.recipient_email, job_id, idx)
            cursor.execute(
                """
                INSERT INTO certificates (
                    id, job_id, recipient_name, recipient_email, identifier,
                    custom_notes, status, error_message, file_path, file_size,
                    verification_code, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, 0, ?, ?, ?)
                """,
                (
                    cert_id,
                    job_id,
                    recipient.recipient_name,
                    recipient.recipient_email,
                    recipient.identifier,
                    recipient.custom_notes,
                    "PENDING",
                    verification_code,
                    now,
                    now,
                ),
            )

        conn.commit()

    return {
        "job_id": job_id,
        "total_recipients": total,
        "status": "QUEUED",
    }


def process_generation_job(job_id: str):
    """
    Worker task: Processes all certificates for a job sequentially/batch.
    Catches errors per individual recipient without halting the rest of the batch.
    Updates the parent job status to PROCESSING -> COMPLETED/PARTIAL_SUCCESS/FAILED.
    """
    # 1. Mark job as PROCESSING
    now = get_current_iso_time()
    with get_db_connection() as conn:
        conn.execute(
            "UPDATE jobs SET status = 'PROCESSING', updated_at = ? WHERE id = ?",
            (now, job_id),
        )
        conn.commit()

    # 2. Retrieve job metadata and pending certificates
    with get_db_connection() as conn:
        job = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not job:
            return
        certificates = conn.execute(
            "SELECT * FROM certificates WHERE job_id = ? ORDER BY created_at ASC",
            (job_id,),
        ).fetchall()

    job_title = job["title"]
    issuer_name = job["issuer_name"]
    issuer_title = job["issuer_title"]
    issue_date = job["issue_date"]

    job_folder = os.path.join(CERTIFICATES_DIR, job_id)
    os.makedirs(job_folder, exist_ok=True)

    completed_count = 0
    failed_count = 0

    # 3. Process each certificate with isolated try/except block
    for cert in certificates:
        cert_id = cert["id"]
        recipient_name = cert["recipient_name"]
        recipient_email = cert["recipient_email"]
        identifier = cert["identifier"]
        custom_notes = cert["custom_notes"]
        verification_code = cert["verification_code"]

        # Mark certificate as GENERATING
        with get_db_connection() as conn:
            conn.execute(
                "UPDATE certificates SET status = 'GENERATING', updated_at = ? WHERE id = ?",
                (get_current_iso_time(), cert_id),
            )
            conn.commit()

        try:
            # Check for simulated test error or invalid data triggers
            if "fail_test" in recipient_email.lower():
                raise RuntimeError("Simulated failure trigger for recipient testing")

            pdf_filename = f"{cert_id}.pdf"
            output_path = os.path.join(job_folder, pdf_filename)

            # Generate the vector PDF certificate
            file_size = generate_pdf_certificate(
                output_path=output_path,
                recipient_name=recipient_name,
                course_title=job_title,
                issuer_name=issuer_name,
                issuer_title=issuer_title,
                issue_date=issue_date,
                verification_code=verification_code,
                identifier=identifier,
                custom_notes=custom_notes,
            )

            # Update certificate to COMPLETED
            update_time = get_current_iso_time()
            with get_db_connection() as conn:
                conn.execute(
                    """
                    UPDATE certificates
                    SET status = 'COMPLETED', file_path = ?, file_size = ?, error_message = NULL, updated_at = ?
                    WHERE id = ?
                    """,
                    (output_path, file_size, update_time, cert_id),
                )
                conn.commit()

            completed_count += 1

        except Exception as ex:
            error_msg = f"{type(ex).__name__}: {str(ex)}"
            update_time = get_current_iso_time()

            with get_db_connection() as conn:
                conn.execute(
                    """
                    UPDATE certificates
                    SET status = 'FAILED', error_message = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (error_msg, update_time, cert_id),
                )
                conn.commit()

            failed_count += 1

        # Incrementally update parent job progress in DB for real-time polling
        with get_db_connection() as conn:
            conn.execute(
                """
                UPDATE jobs
                SET completed_count = ?, failed_count = ?, updated_at = ?
                WHERE id = ?
                """,
                (completed_count, failed_count, get_current_iso_time(), job_id),
            )
            conn.commit()

    # 4. Finalize overall job status
    total = len(certificates)
    if completed_count == total:
        final_status = "COMPLETED"
    elif completed_count > 0 and failed_count > 0:
        final_status = "PARTIAL_SUCCESS"
    elif failed_count == total:
        final_status = "FAILED"
    else:
        final_status = "COMPLETED"

    # 5. Pre-build ZIP archive if at least one certificate completed
    if completed_count > 0:
        try:
            zip_path = os.path.join(ZIPS_DIR, f"{job_id}.zip")
            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
                for cert in certificates:
                    with get_db_connection() as conn:
                        row = conn.execute("SELECT * FROM certificates WHERE id = ?", (cert["id"],)).fetchone()
                        if row and row["status"] == "COMPLETED" and row["file_path"] and os.path.exists(row["file_path"]):
                            # Clean safe filename for zip archive
                            safe_name = "".join(c for c in row["recipient_name"] if c.isalnum() or c in (" ", "-", "_")).strip()
                            safe_filename = f"Certificate_{safe_name}_{row['verification_code']}.pdf"
                            zipf.write(row["file_path"], arcname=safe_filename)
        except Exception as e:
            print(f"Error creating pre-packaged ZIP for job {job_id}: {e}")

    with get_db_connection() as conn:
        conn.execute(
            """
            UPDATE jobs
            SET status = ?, completed_count = ?, failed_count = ?, updated_at = ?
            WHERE id = ?
            """,
            (final_status, completed_count, failed_count, get_current_iso_time(), job_id),
        )
        conn.commit()


def get_job_summary(job_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve summarized progress and counts for a job."""
    with get_db_connection() as conn:
        job = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not job:
            return None

        total = job["total_recipients"]
        completed = job["completed_count"]
        failed = job["failed_count"]
        pct = 0.0 if total == 0 else round(((completed + failed) / total) * 100, 1)

        return {
            "id": job["id"],
            "title": job["title"],
            "issuer_name": job["issuer_name"],
            "issuer_title": job["issuer_title"],
            "issue_date": job["issue_date"],
            "template_name": job["template_name"],
            "status": job["status"],
            "total_recipients": total,
            "completed_count": completed,
            "failed_count": failed,
            "progress_percentage": pct,
            "created_at": job["created_at"],
            "updated_at": job["updated_at"],
            "download_zip_url": f"/api/jobs/{job['id']}/download-zip" if completed > 0 else None,
        }


def get_job_detail(job_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve full job detail including recipient certificate records."""
    summary = get_job_summary(job_id)
    if not summary:
        return None

    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM certificates WHERE job_id = ? ORDER BY created_at ASC",
            (job_id,),
        ).fetchall()

        recipients = []
        for r in rows:
            recipients.append({
                "id": r["id"],
                "job_id": r["job_id"],
                "recipient_name": r["recipient_name"],
                "recipient_email": r["recipient_email"],
                "identifier": r["identifier"],
                "custom_notes": r["custom_notes"],
                "status": r["status"],
                "error_message": r["error_message"],
                "verification_code": r["verification_code"],
                "file_size": r["file_size"] or 0,
                "download_url": f"/api/certificates/{r['id']}/download" if r["status"] == "COMPLETED" else None,
                "preview_url": f"/api/certificates/{r['id']}/preview" if r["status"] == "COMPLETED" else None,
                "created_at": r["created_at"],
                "updated_at": r["updated_at"],
            })

        summary["recipients"] = recipients
        return summary
