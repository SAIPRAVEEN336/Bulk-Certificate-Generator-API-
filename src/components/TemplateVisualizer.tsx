import React, { useState } from 'react';
import { Eye, Sliders, Sparkles, Download, CheckCircle2 } from 'lucide-react';
import { generateCertificateSvg, generateCertificatePdfBlob } from '../services/certificateGenerator';

export const TemplateVisualizer: React.FC = () => {
  const [recipientName, setRecipientName] = useState('Alexandria M. Vance');
  const [courseTitle, setCourseTitle] = useState('Advanced Distributed Systems & High-Throughput Engineering');
  const [issuerName, setIssuerName] = useState('Global Institute of Technology');
  const [issuerTitle, setIssuerTitle] = useState('Head of Engineering Academics');
  const [issueDate, setIssueDate] = useState('October 7, 2026');
  const [identifier, setIdentifier] = useState('STUDENT-9941');
  const [customNotes, setCustomNotes] = useState('First Class Distinction');

  const svgContent = generateCertificateSvg(
    {
      recipient_name: recipientName,
      identifier,
      custom_notes: customNotes,
      verification_code: 'CERT-DEMO-2026',
    },
    {
      title: courseTitle,
      issuer_name: issuerName,
      issuer_title: issuerTitle,
      issue_date: issueDate,
    }
  );

  const handleDownloadSamplePdf = () => {
    const pdfBlob = generateCertificatePdfBlob(
      {
        recipient_name: recipientName,
        identifier,
        custom_notes: customNotes,
        verification_code: 'CERT-DEMO-2026',
      },
      {
        title: courseTitle,
        issuer_name: issuerName,
        issuer_title: issuerTitle,
        issue_date: issueDate,
      }
    );
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sample_Certificate_${recipientName.replace(/\s+/g, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Sliders className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Predefined Certificate Template Studio
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Preview the standardized landscape certificate layout. Test dynamic text scaling,
              ornamental borders, verified gold seal badges, and typographic hierarchy.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleDownloadSamplePdf}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-amber-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Controls (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Live Preview Parameters
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Recipient Name</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Course / Event Title</label>
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Issuing Organization</label>
              <input
                type="text"
                value={issuerName}
                onChange={(e) => setIssuerName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Signatory Title</label>
              <input
                type="text"
                value={issuerTitle}
                onChange={(e) => setIssuerTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Issue Date</label>
              <input
                type="text"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Recipient ID / Badge</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Honors / Distinction Note</label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setRecipientName('Alexandria M. Vance');
                setCourseTitle('Advanced Distributed Systems & High-Throughput Engineering');
                setIssuerName('Global Institute of Technology');
                setIssuerTitle('Head of Engineering Academics');
                setIssueDate('October 7, 2026');
                setIdentifier('STUDENT-9941');
                setCustomNotes('First Class Distinction');
              }}
              className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        {/* Right Live Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              Dynamic Vector Rendering
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Aspect Ratio: Landscape (Letter / A4)
            </span>
          </div>

          {/* Rendered Certificate Box */}
          <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 shadow-inner overflow-hidden flex items-center justify-center">
            <div
              dangerouslySetInnerHTML={{ __html: svgContent }}
              className="w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden border border-slate-600/40 select-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
