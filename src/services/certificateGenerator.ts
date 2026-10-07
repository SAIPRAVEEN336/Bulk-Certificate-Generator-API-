import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { CertificateItem, Job, RecipientInput } from '../types';

export function generateVerificationCode(email: string, jobId: string, index: number): string {
  const str = `${email}:${jobId}:${index}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `CERT-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

export function generateCertificateSvg(
  recipient: {
    recipient_name: string;
    recipient_email?: string;
    identifier?: string;
    custom_notes?: string;
    verification_code?: string;
  },
  job: {
    title: string;
    issuer_name: string;
    issuer_title: string;
    issue_date: string;
  }
): string {
  const code = recipient.verification_code || 'CERT-PREVIEW-001';
  const width = 1000;
  const height = 700;

  const notesSvg = recipient.custom_notes
    ? `<text x="500" y="445" font-family="'Plus Jakarta Sans', sans-serif" font-weight="600" font-style="italic" font-size="16" fill="#b45309" text-anchor="middle">★ ${escapeXml(recipient.custom_notes)} ★</text>`
    : '';

  const idSvg = recipient.identifier
    ? `<text x="210" y="585" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" fill="#64748b" text-anchor="middle">ID: ${escapeXml(recipient.identifier)}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
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

  <!-- Background Warm Canvas -->
  <rect width="${width}" height="${height}" fill="#fcfbf7" rx="8" />

  <!-- Outer Deep Navy Border -->
  <rect x="25" y="25" width="${width - 50}" height="${height - 50}" fill="none" stroke="#0f172a" stroke-width="5" rx="4" />

  <!-- Inner Gold Border -->
  <rect x="36" y="36" width="${width - 72}" height="${height - 72}" fill="none" stroke="#d97706" stroke-width="2" rx="2" />

  <!-- Corner Badges -->
  <rect x="36" y="36" width="18" height="18" fill="#b45309" />
  <rect x="${width - 54}" y="36" width="18" height="18" fill="#b45309" />
  <rect x="36" y="${height - 54}" width="18" height="18" fill="#b45309" />
  <rect x="${width - 54}" y="${height - 54}" width="18" height="18" fill="#b45309" />

  <!-- Top Issuer Brand -->
  <text x="500" y="90" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="700" letter-spacing="3" fill="#475569" text-anchor="middle">
    ${escapeXml(job.issuer_name.toUpperCase())}
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
    ${escapeXml(recipient.recipient_name)}
  </text>
  <line x1="260" y1="305" x2="740" y2="305" stroke="#cbd5e1" stroke-width="1.5" />

  <!-- Description -->
  <text x="500" y="350" font-family="'Plus Jakarta Sans', sans-serif" font-size="15" fill="#475569" text-anchor="middle">
    for successfully fulfilling all curriculum requirements and standards in
  </text>

  <!-- Course Title -->
  <text x="500" y="400" font-family="'Plus Jakarta Sans', sans-serif" font-size="26" font-weight="700" fill="#1e3a8a" text-anchor="middle">
    "${escapeXml(job.title)}"
  </text>

  ${notesSvg}

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
    <text x="0" y="0" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="700" fill="#0f172a" text-anchor="middle">${escapeXml(job.issue_date)}</text>
    <line x1="-90" y1="12" x2="90" y2="12" stroke="#94a3b8" stroke-width="1.5" />
    <text x="0" y="32" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="600" letter-spacing="1" fill="#64748b" text-anchor="middle">DATE OF ISSUANCE</text>
    ${idSvg}
  </g>

  <!-- Right Column: Signatory Signature & Title -->
  <g transform="translate(790, 520)">
    <text x="0" y="-4" font-family="'Playfair Display', cursive, serif" font-size="24" font-style="italic" fill="#1e293b" text-anchor="middle">${escapeXml(job.issuer_name)}</text>
    <line x1="-100" y1="12" x2="100" y2="12" stroke="#94a3b8" stroke-width="1.5" />
    <text x="0" y="32" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="700" letter-spacing="1" fill="#64748b" text-anchor="middle">${escapeXml(job.issuer_title.toUpperCase())}</text>
    <text x="0" y="48" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">AUTHORIZED SIGNATURE</text>
  </g>

  <!-- Footer Security Text -->
  <text x="500" y="660" font-family="'JetBrains Mono', monospace" font-size="10" fill="#94a3b8" text-anchor="middle">
    Credential ID: ${code}  •  Digital Tamper-Evident Verification  •  Issued by ${escapeXml(job.issuer_name)}
  </text>
</svg>`;
}

export function generateCertificatePdfBlob(
  recipient: {
    recipient_name: string;
    identifier?: string;
    custom_notes?: string;
    verification_code: string;
  },
  job: {
    title: string;
    issuer_name: string;
    issuer_title: string;
    issue_date: string;
  }
): Blob {
  // US Letter Landscape: 279.4 x 215.9 mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = 279.4;
  const pageHeight = 215.9;

  // Background Parchment
  doc.setFillColor(252, 251, 247);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer Navy Border
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(1.8);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S');

  // Inner Gold Border
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.8);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24, 'S');

  // Corner Accents
  doc.setFillColor(180, 83, 9);
  doc.rect(12, 12, 5, 5, 'F');
  doc.rect(pageWidth - 17, 12, 5, 5, 'F');
  doc.rect(12, pageHeight - 17, 5, 5, 'F');
  doc.rect(pageWidth - 17, pageHeight - 17, 5, 5, 'F');

  // Organization Header
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(job.issuer_name.toUpperCase(), pageWidth / 2, 28, { align: 'center' });

  // Certificate Heading
  doc.setTextColor(15, 23, 42);
  doc.setFont('times', 'bold');
  doc.setFontSize(26);
  doc.text('CERTIFICATE OF COMPLETION', pageWidth / 2, 44, { align: 'center' });

  // Divider
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.6);
  doc.line(pageWidth / 2 - 40, 48, pageWidth / 2 + 40, 48);

  // Presentation Subtitle
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('PROUDLY PRESENTED TO', pageWidth / 2, 60, { align: 'center' });

  // Recipient Name
  doc.setTextColor(15, 23, 42);
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(30);
  doc.text(recipient.recipient_name, pageWidth / 2, 78, { align: 'center' });

  // Recipient underline
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(pageWidth / 2 - 60, 83, pageWidth / 2 + 60, 83);

  // Context sentence
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('for successfully fulfilling all curriculum requirements and standards in', pageWidth / 2, 95, { align: 'center' });

  // Course Title
  doc.setTextColor(30, 58, 138);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(`"${job.title}"`, pageWidth / 2, 108, { align: 'center' });

  // Custom Notes
  if (recipient.custom_notes) {
    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(11);
    doc.text(`* ${recipient.custom_notes} *`, pageWidth / 2, 120, { align: 'center' });
  }

  // Gold Seal in Center
  const sealX = pageWidth / 2;
  const sealY = 158;
  doc.setFillColor(254, 240, 138);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.8);
  doc.circle(sealX, sealY, 13, 'FD');

  doc.setTextColor(120, 53, 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('OFFICIAL', sealX, sealY - 3, { align: 'center' });
  doc.setFontSize(8.5);
  doc.text('VERIFIED', sealX, sealY + 2, { align: 'center' });
  doc.setFontSize(5.5);
  doc.text('CREDENTIAL', sealX, sealY + 6, { align: 'center' });

  // Left Column: Date & ID
  const leftX = 55;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(job.issue_date, leftX, 153, { align: 'center' });
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(leftX - 25, 157, leftX + 25, 157);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('DATE OF ISSUANCE', leftX, 162, { align: 'center' });
  if (recipient.identifier) {
    doc.text(`ID: ${recipient.identifier}`, leftX, 168, { align: 'center' });
  }

  // Right Column: Signatory
  const rightX = pageWidth - 55;
  doc.setTextColor(30, 41, 59);
  doc.setFont('times', 'italic');
  doc.setFontSize(16);
  doc.text(job.issuer_name, rightX, 152, { align: 'center' });
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(rightX - 30, 157, rightX + 30, 157);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(job.issuer_title.toUpperCase(), rightX, 162, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('AUTHORIZED SIGNATURE', rightX, 167, { align: 'center' });

  // Footer Verification Token
  doc.setTextColor(148, 163, 184);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    `Credential ID: ${recipient.verification_code}  |  Issued by ${job.issuer_name}`,
    pageWidth / 2,
    pageHeight - 12,
    { align: 'center' }
  );

  return doc.output('blob');
}

export async function generateBulkZip(job: Job): Promise<Blob> {
  const zip = new JSZip();

  for (const cert of job.certificates) {
    if (cert.status === 'COMPLETED' && cert.pdfBlob) {
      const safeName = cert.recipient_name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
      const filename = `Certificate_${safeName}_${cert.verification_code}.pdf`;
      zip.file(filename, cert.pdfBlob);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}
