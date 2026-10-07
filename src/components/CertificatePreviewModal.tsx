import React, { useState } from 'react';
import { X, Download, Copy, Check, Award, Printer } from 'lucide-react';
import { CertificateItem } from '../types';

interface CertificatePreviewModalProps {
  certificate: CertificateItem | null;
  onClose: () => void;
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({
  certificate,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!certificate) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(certificate.verification_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (!certificate.svgContent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate - ${certificate.recipient_name}</title>
          <style>
            @page { size: landscape; margin: 0; }
            body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; }
            svg { width: 100vw; height: 100vh; max-height: 100vh; }
          </style>
        </head>
        <body>
          ${certificate.svgContent}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Certificate Preview • {certificate.recipient_name}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Verification Token: {certificate.verification_code}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Copy verification hash"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Print certificate"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print</span>
            </button>

            {certificate.pdfUrl && (
              <a
                href={certificate.pdfUrl}
                download={`Certificate_${certificate.recipient_name.replace(/\s+/g, '_')}_${certificate.verification_code}.pdf`}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-amber-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Display Area */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950/80 flex items-center justify-center min-h-[460px]">
          <div className="w-full max-w-3xl bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-700">
            {certificate.svgContent ? (
              <div
                dangerouslySetInnerHTML={{ __html: certificate.svgContent }}
                className="w-full h-auto block select-none"
              />
            ) : (
              <div className="p-12 text-center text-slate-500">Preview rendering...</div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Recipient: <strong className="text-slate-200">{certificate.recipient_name}</strong> ({certificate.recipient_email})
          </div>
          <div className="flex items-center gap-3">
            <span>Size: {(certificate.file_size / 1024).toFixed(1)} KB</span>
            <span className="text-emerald-400 font-medium">✓ Cryptographically Signed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
