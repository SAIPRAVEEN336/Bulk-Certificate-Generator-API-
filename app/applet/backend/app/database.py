"""
Database configuration and SQLite connection management.
Uses a relational SQLite database with WAL mode and foreign key enforcement.
"""

import sqlite3
import os
from contextlib import contextmanager

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "certificates.db")


def get_db_path() -> str:
    return os.environ.get("CERTIFICATE_DB_PATH", DB_PATH)


def init_db(db_path: str = None):
    """Initialize database tables with relational foreign keys and indexes."""
    target_path = db_path or get_db_path()
    os.makedirs(os.path.dirname(target_path), exist_ok=True)

    with sqlite3.connect(target_path) as conn:
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA foreign_keys = ON;")
        cursor = conn.cursor()

        # Jobs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                issuer_name TEXT NOT NULL,
                issuer_title TEXT NOT NULL,
                issue_date TEXT NOT NULL,
                template_name TEXT NOT NULL DEFAULT 'standard_landscape',
                status TEXT NOT NULL, -- 'QUEUED', 'PROCESSING', 'COMPLETED', 'PARTIAL_SUCCESS', 'FAILED'
                total_recipients INTEGER NOT NULL DEFAULT 0,
                completed_count INTEGER NOT NULL DEFAULT 0,
                failed_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)

        # Certificates table (1-to-many relationship with jobs)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS certificates (
                id TEXT PRIMARY KEY,
                job_id TEXT NOT NULL,
                recipient_name TEXT NOT NULL,
                recipient_email TEXT NOT NULL,
                identifier TEXT,
                custom_notes TEXT,
                status TEXT NOT NULL, -- 'PENDING', 'GENERATING', 'COMPLETED', 'FAILED'
                error_message TEXT,
                file_path TEXT,
                file_size INTEGER DEFAULT 0,
                verification_code TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
            );
        """)

        # Indexes for fast lookup
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_certificates_job_id ON certificates(job_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON certificates(verification_code);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);")

        conn.commit()


@contextmanager
def get_db_connection(db_path: str = None):
    """Context manager providing thread-safe connection with row_factory dict access."""
    target_path = db_path or get_db_path()
    conn = sqlite3.connect(target_path, timeout=30.0)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
