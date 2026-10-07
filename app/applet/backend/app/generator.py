"""
Predefined Certificate Template Generator.
Generates publication-quality landscape certificates in PDF format via ReportLab.
"""

import os
import hashlib
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas


def generate_verification_code(recipient_email: str, job_id: str, index: int) -> str:
    """Generate a reproducible, short unique cryptographic verification token."""
    raw = f"{recipient_email}:{job_id}:{index}"
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:10].upper()
    return f"CERT-{digest[:4]}-{digest[4:8]}"


def generate_pdf_certificate(
    output_path: str,
    recipient_name: str,
    course_title: str,
    issuer_name: str,
    issuer_title: str,
    issue_date: str,
    verification_code: str,
    identifier: str = None,
    custom_notes: str = None,
) -> int:
    """
    Generate high-resolution vector PDF certificate using ReportLab.
    Returns file size in bytes.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    page_width, page_height = landscape(letter)
    c = canvas.Canvas(output_path, pagesize=(page_width, page_height))
    c.setTitle(f"Certificate of Completion - {recipient_name}")

    # 1. Background Fill
    c.setFillColor(colors.HexColor("#FCFBF7"))
    c.rect(0, 0, page_width, page_height, fill=1, stroke=0)

    # 2. Outer Deep Navy Border
    c.setStrokeColor(colors.HexColor("#0F172A"))
    c.setLineWidth(4)
    c.rect(24, 24, page_width - 48, page_height - 48, fill=0, stroke=1)

    # 3. Inner Gold Accent Border
    c.setStrokeColor(colors.HexColor("#D97706"))
    c.setLineWidth(1.5)
    c.rect(32, 32, page_width - 64, page_height - 64, fill=0, stroke=1)

    # Corner Decorative Squares
    corner_size = 14
    c.setFillColor(colors.HexColor("#B45309"))
    for x in [32, page_width - 32 - corner_size]:
        for y in [32, page_height - 32 - corner_size]:
            c.rect(x, y, corner_size, corner_size, fill=1, stroke=0)

    # 4. Top Organization / Issuer Branding
    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(page_width / 2, page_height - 75, issuer_name.upper())

    # 5. Certificate Header
    c.setFillColor(colors.HexColor("#0F172A"))
    c.setFont("Times-Bold", 30)
    c.drawCentredString(page_width / 2, page_height - 120, "CERTIFICATE OF COMPLETION")

    # Divider
    c.setStrokeColor(colors.HexColor("#D97706"))
    c.setLineWidth(2)
    c.line(page_width / 2 - 120, page_height - 135, page_width / 2 + 120, page_height - 135)
    c.circle(page_width / 2, page_height - 135, 3.5, fill=1, stroke=0)

    # 6. Presentation Line
    c.setFillColor(colors.HexColor("#64748B"))
    c.setFont("Helvetica", 12)
    c.drawCentredString(page_width / 2, page_height - 165, "PROUDLY PRESENTED TO")

    # 7. Recipient Name
    c.setFillColor(colors.HexColor("#0F172A"))
    c.setFont("Times-BoldItalic", 34)
    c.drawCentredString(page_width / 2, page_height - 215, recipient_name)

    # Name underline
    c.setStrokeColor(colors.HexColor("#CBD5E1"))
    c.setLineWidth(1)
    c.line(page_width / 2 - 200, page_height - 228, page_width / 2 + 200, page_height - 228)

    # 8. Achievement Context
    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Helvetica", 12)
    c.drawCentredString(
        page_width / 2,
        page_height - 260,
        "for successfully fulfilling all curriculum requirements and standards in",
    )

    # 9. Course / Event Title
    c.setFillColor(colors.HexColor("#1E3A8A"))
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(page_width / 2, page_height - 295, f'"{course_title}"')

    # Optional Honors
    if custom_notes:
        c.setFillColor(colors.HexColor("#B45309"))
        c.setFont("Helvetica-BoldOblique", 12)
        c.drawCentredString(page_width / 2, page_height - 325, f"★ {custom_notes} ★")

    # 10. Center Gold Verification Seal
    seal_x = page_width / 2
    seal_y = 135
    c.setFillColor(colors.HexColor("#FDE68A"))
    c.setStrokeColor(colors.HexColor("#D97706"))
    c.setLineWidth(2)
    c.circle(seal_x, seal_y, 36, fill=1, stroke=1)
    c.setStrokeColor(colors.HexColor("#B45309"))
    c.setLineWidth(1)
    c.circle(seal_x, seal_y, 30, fill=0, stroke=1)
    c.setFillColor(colors.HexColor("#92400E"))
    c.setFont("Helvetica-Bold", 7.5)
    c.drawCentredString(seal_x, seal_y + 10, "OFFICIAL")
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(seal_x, seal_y - 2, "VERIFIED")
    c.setFont("Helvetica", 6.5)
    c.drawCentredString(seal_x, seal_y - 12, "SEAL OF EXCELLENCE")

    # 11. Left Column: Date & ID
    left_x = 160
    c.setFillColor(colors.HexColor("#0F172A"))
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(left_x, 140, issue_date)
    c.setStrokeColor(colors.HexColor("#94A3B8"))
    c.setLineWidth(1)
    c.line(left_x - 70, 132, left_x + 70, 132)
    c.setFillColor(colors.HexColor("#64748B"))
    c.setFont("Helvetica", 9)
    c.drawCentredString(left_x, 118, "DATE OF ISSUANCE")
    if identifier:
        c.setFont("Helvetica", 8)
        c.drawCentredString(left_x, 104, f"ID: {identifier}")

    # 12. Right Column: Signatory
    right_x = page_width - 160
    c.setFillColor(colors.HexColor("#1E293B"))
    c.setFont("Times-Italic", 18)
    c.drawCentredString(right_x, 142, issuer_name)
    c.setStrokeColor(colors.HexColor("#94A3B8"))
    c.setLineWidth(1)
    c.line(right_x - 80, 132, right_x + 80, 132)
    c.setFillColor(colors.HexColor("#64748B"))
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(right_x, 118, issuer_title)
    c.setFont("Helvetica", 8)
    c.drawCentredString(right_x, 104, "AUTHORIZED SIGNATURE")

    # 13. Footer: Unique Verification Hash
    c.setFillColor(colors.HexColor("#94A3B8"))
    c.setFont("Helvetica", 7.5)
    footer_text = f"Credential ID: {verification_code}  •  Issued by {issuer_name}"
    c.drawCentredString(page_width / 2, 45, footer_text)

    c.showPage()
    c.save()

    return os.path.getsize(output_path)
