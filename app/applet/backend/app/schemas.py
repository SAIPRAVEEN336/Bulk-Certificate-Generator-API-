"""
Pydantic models and schemas for request validation and response serialization.
"""

from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
import re

EMAIL_REGEX = re.compile(r"^[\w\.\+\-]+@[\w\.\-]+\.[a-zA-Z]{2,}$")


class RecipientInput(BaseModel):
    recipient_name: str = Field(..., min_length=1, max_length=150, description="Full name of recipient")
    recipient_email: str = Field(..., min_length=3, max_length=254, description="Recipient email address")
    identifier: Optional[str] = Field(None, max_length=50, description="Optional recipient ID or badge number")
    custom_notes: Optional[str] = Field(None, max_length=200, description="Optional distinction or honors")

    @field_validator("recipient_name")
    @classmethod
    def validate_recipient_name(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Recipient name cannot be blank or whitespace only")
        return clean

    @field_validator("recipient_email")
    @classmethod
    def validate_recipient_email(cls, v: str) -> str:
        clean = v.strip()
        if not EMAIL_REGEX.match(clean):
            raise ValueError(f"Invalid email address format: '{clean}'")
        return clean


class BulkCertificateCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200, description="Course, workshop, or award title")
    issuer_name: str = Field(..., min_length=2, max_length=150, description="Organization or institution granting certificate")
    issuer_title: str = Field("Authorized Signatory", max_length=100, description="Title of signatory")
    issue_date: str = Field(..., min_length=4, max_length=50, description="Date of issuance")
    template_name: Optional[str] = Field("standard_landscape", description="Predefined template")
    recipients: List[RecipientInput] = Field(..., min_length=1, max_length=1000, description="List of recipient details")

    @field_validator("title", "issuer_name")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Field cannot be empty or whitespace only")
        return clean


class CertificateItemResponse(BaseModel):
    id: str
    job_id: str
    recipient_name: str
    recipient_email: str
    identifier: Optional[str] = None
    custom_notes: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    verification_code: str
    file_size: int = 0
    download_url: Optional[str] = None
    created_at: str
    updated_at: str


class JobSummaryResponse(BaseModel):
    id: str
    title: str
    issuer_name: str
    issuer_title: str
    issue_date: str
    template_name: str
    status: str
    total_recipients: int
    completed_count: int
    failed_count: int
    progress_percentage: float
    created_at: str
    updated_at: str
    download_zip_url: Optional[str] = None


class JobDetailResponse(JobSummaryResponse):
    recipients: List[CertificateItemResponse] = []


class JobCreatedResponse(BaseModel):
    job_id: str
    status: str
    message: str
    total_recipients: int
    status_url: str
    download_zip_url: str
