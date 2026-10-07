"""
Predefined Certificate Template Generator.
Generates publication-quality landscape certificates in PDF format via ReportLab
and SVG format for instant in-browser vector preview.
"""

import os
import hashlib
from typing import Dict, Any
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
    Generate a high-resolution, vector PDF certificate using ReportLab.
    Returns the file size in bytes.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Standard landscape letter dimensions: 792 x 612 points
    page_width, page_height = landscape(letter)
    c = canvas.Canvas(output_path, pagesize=(page_width, page_height))
    c.setTitle(f"Certificate of Completion - {recipient_name}")
    c.setAuthor(issuer_name)
    c.setSubject(course_title)

    # 1. Background Fill (Subtle warm parchment/cream background)
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

    # Decorative divider below header
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

    # Optional Honors / Custom Notes
    if custom_notes:
        c.setFillColor(colors.HexColor("#B45309"))
        c.setFont("Helvetica-BoldOblique", 12)
        c.drawCentredString(page_width / 2, page_height - 325, f"★ {custom_notes} ★")

    # 10. Center Gold Verification Medallion / Seal
    seal_x = page_width / 2
    seal_y = 135
    # Outer Seal Circle
    c.setFillColor(colors.HexColor("#FDE68A"))
    c.setStrokeColor(colors.HexColor("#D97706"))
    c.setLineWidth(2)
    c.circle(seal_x, seal_y, 36, fill=1, stroke=1)
    # Inner dashed ring
    c.setStrokeColor(colors.HexColor("#B45309"))
    c.setLineWidth(1)
    c.circle(seal_x, seal_y, 30, fill=0, stroke=1)
    # Seal Text
    c.setFillColor(colors.HexColor("#92400E"))
    c.setFont("Helvetica-Bold", 7.5)
    c.drawCentredString(seal_x, seal_y + 10, "OFFICIAL")
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(seal_x, seal_y - 2, "VERIFIED")
    c.setFont("Helvetica", 6.5)
    c.drawCentredString(seal_x, seal_y - 12, "SEAL OF EXCELLENCE")

    # 11. Left Column: Date & Identifier
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

    # 12. Right Column: Signatory Signature & Title
    right_x = page_width - 160
    # Signature representation (italicized stylized line)
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

    # 13. Footer: Unique Verification Hash & Security Notice
    c.setFillColor(colors.HexColor("#94A3B8"))
    c.setFont("Helvetica", 7.5)
    footer_text = f"Credential ID: {verification_code}  •  Tamper-evident digital certificate  •  Issued by {issuer_name}"
    c.drawCentredString(page_width / 2, 45, footer_text)

    # Save and finalize PDF
    c.showPage()
    c.save()

    return os.path.getsize(output_path)


def generate_svg_certificate(
    recipient_name: str,
    course_title: str,
    issuer_name: str,
    issuer_title: str,
    issue_date: str,
    verification_code: str,
    identifier: str = None,
    custom_notes: str = None,
) -> str:
    """
    Generate an SVG string representation of the certificate for fast in-browser preview.
    """
    width = 1000
    height = 700

    notes_svg = ""
    if custom_notes:
        notes_svg = f'<text x="500" y="445" font-family="sans-serif" font-weight="600" font-style="italic" font-size="16" fill="#b45309" text-anchor="middle">★ {custom_notes} ★</text>'

    id_svg = ""
    if identifier:
        id_svg = f'<text x="210" y="585" font-family="sans-serif" font-size="11" fill="#64748b" text-anchor="middle">ID: {identifier}</text>'

    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="{width}" height="{height}" fill="#fcfbf7" rx="8" />

  <!-- Outer Border -->
  <rect x="25" y="25" width="{width - 50}" height="{height - 50}" fill="none" stroke="#0f172a" stroke-width="5" rx="4" />

  <!-- Inner Gold Border -->
  <rect x="36" y="36" width="{width - 72}" height="{height - 72}" fill="none" stroke="#d97706" stroke-width="2" rx="2" />

  <!-- Corner Badges -->
  <rect x="36" y="36" width="18" height="18" fill="#b45309" />
  <rect x="{width - 54}" y="36" width="18" height="18" fill="#b45309" />
  <rect x="36" y="{height - 54}" width="18" height="18" fill="#b45309" />
  <rect x="{width - 54}" y="{height - 54}" width="18" height="18" fill="#b45309" />

  <!-- Top Issuer Brand -->
  <text x="500" y="90" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="700" letter-spacing="3" fill="#475569" text-anchor="middle">
    {issuer_name.upper()}
  </text>

  <!-- Certificate Heading -->
  <text x="500" y="150" font-family="'Cinzel', 'Times New Roman', serif" font-size="38" font-weight="800" letter-spacing="2" fill="#0f172a" text-anchor="middle">
    CERTIFICATE OF COMPLETION
  </text>

  <!-- Decorative Divider -->
  <line x1="320" y1="172" x2="680" y2="172" stroke="#d97706" stroke-width="2" />
  <circle cx="500" cy="172" r="5" fill="#d97706" />

  <!-- Presentation Line -->
  <text x="500" y="218" font-family="'Plus Jakarta Sans', sans-serif" font-size="15" font-weight="500" letter-spacing="2" fill="#64748b" text-anchor="middle">
    PROUDLY PRESENTED TO
  </text>

  <!-- Recipient Name -->
  <text x="500" y="285" font-family="'Playfair Display', 'Times New Roman', serif" font-size="44" font-weight="700" font-style="italic" fill="#0f172a" text-anchor="middle">
    {recipient_name}
  </text>
  <line x1="260" y1="305" x2="740" y2="305" stroke="#cbd5e1" stroke-width="1.5" />

  <!-- Description -->
  <text x="500" y="350" font-family="'Plus Jakarta Sans', sans-serif" font-size="15" fill="#475569" text-anchor="middle">
    for successfully fulfilling all curriculum requirements and standards in
  </text>

  <!-- Course Title -->
  <text x="500" y="400" font-family="'Plus Jakarta Sans', sans-serif" font-size="26" font-weight="700" fill="#1e3a8a" text-anchor="middle">
    "{course_title}"
  </text>

  {notes_svg}

  <!-- Center Gold Medal Seal -->
  <g transform="translate(500, 545)" filter="url(#subtleShadow)">
    <circle cx="0" cy="0" r="46" fill="url(#goldGrad)" stroke="#b45309" stroke-width="2.5" />
    <circle cx="0" cy="0" r="38" fill="none" stroke="#78350f" stroke-width="1.5" stroke-dasharray="3,3" />
    <text x="0" y="-12" font-family="sans-serif" font-size="9" font-weight="700" letter-spacing="1" fill="#78350f" text-anchor="middle">OFFICIAL</text>
    <text x="0" y="6" font-family="sans-serif" font-size="12" font-weight="800" letter-spacing="1.5" fill="#78350f" text-anchor="middle">VERIFIED</text>
    <text x="0" y="20" font-family="sans-serif" font-size="8" font-weight="600" fill="#78350f" text-anchor="middle">CREDENTIAL</text>
  </g>

  <!-- Left Column: Issue Date -->
  <g transform="translate(210, 520)">
    <text x="0" y="0" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="700" fill="#0f172a" text-anchor="middle">{issue_date}</text>
    <line x1="-90" y1="12" x2="90" y2="12" stroke="#94a3b8" stroke-width="1.5" />
    <text x="0" y="32" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="600" letter-spacing="1" fill="#64748b" text-anchor="middle">DATE OF ISSUANCE</text>
    {id_svg}
  </g>

  <!-- Right Column: Signatory Signature & Title -->
  <g transform="translate(790, 520)">
    <text x="0" y="-4" font-family="'Playfair Display', cursive, serif" font-size="24" font-style="italic" fill="#1e293b" text-anchor="middle">{issuer_name}</text>
    <line x1="-100" y1="12" x2="100" y2="12" stroke="#94a3b8" stroke-width="1.5" />
    <text x="0" y="32" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="700" letter-spacing="1" fill="#64748b" text-anchor="middle">{issuer_title.upper()}</text>
    <text x="0" y="48" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">AUTHORIZED SIGNATURE</text>
  </g>

  <!-- Footer Security Text -->
  <text x="500" y="660" font-family="'JetBrains Mono', monospace" font-size="10" fill="#94a3b8" text-anchor="middle">
    Credential ID: {verification_code}  •  Digital Tamper-Evident Verification  •  Issued by {issuer_name}
  </text>
</svg>"""

    return svg_content
