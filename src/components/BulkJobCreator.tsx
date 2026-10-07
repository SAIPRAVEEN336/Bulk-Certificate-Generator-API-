import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Sparkles,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  ShieldAlert,
  GraduationCap,
} from 'lucide-react';
import { RecipientInput, BulkCertificateCreatePayload } from '../types';

interface BulkJobCreatorProps {
  onSubmitJob: (payload: BulkCertificateCreatePayload) => void;
  isSubmitting: boolean;
}

const PRESET_BOOTCAMP: RecipientInput[] = [
  { recipient_name: 'Alex Rivera', recipient_email: 'alex.rivera@example.com', identifier: 'ENG-2026-01', custom_notes: 'Valedictorian' },
  { recipient_name: 'Sophia Chen', recipient_email: 'sophia.chen@example.com', identifier: 'ENG-2026-02', custom_notes: 'High Honors' },
  { recipient_name: 'Marcus Brody', recipient_email: 'marcus.b@example.com', identifier: 'ENG-2026-03' },
  { recipient_name: 'Elena Rostova', recipient_email: 'elena.rostova@example.com', identifier: 'ENG-2026-04', custom_notes: 'Distinction' },
  { recipient_name: 'Liam Gallagher', recipient_email: 'liam.g@example.com', identifier: 'ENG-2026-05' },
  { recipient_name: 'Nadia Patel', recipient_email: 'nadia.patel@example.com', identifier: 'ENG-2026-06', custom_notes: 'Excellence in Capstone' },
  { recipient_name: 'Mateo Morales', recipient_email: 'mateo.m@example.com', identifier: 'ENG-2026-07' },
  { recipient_name: 'Chloe Dubois', recipient_email: 'chloe.dubois@example.com', identifier: 'ENG-2026-08' },
];

const PRESET_EXECUTIVE: RecipientInput[] = [
  { recipient_name: 'Dr. Sarah Connor', recipient_email: 's.connor@cyberdyne.org', identifier: 'EXEC-901', custom_notes: 'Dean\'s Honor Roll' },
  { recipient_name: 'Jameson Locke', recipient_email: 'j.locke@unsc.gov', identifier: 'EXEC-902', custom_notes: 'Summa Cum Laude' },
  { recipient_name: 'Aisha Al-Mansoor', recipient_email: 'aisha@globalfoundry.com', identifier: 'EXEC-903', custom_notes: 'Magna Cum Laude' },
  { recipient_name: 'David Kim', recipient_email: 'd.kim@solartechnologies.io', identifier: 'EXEC-904', custom_notes: 'First Class Honors' },
];

const PRESET_RESILIENCE_TEST: RecipientInput[] = [
  { recipient_name: 'Arthur Pendelton', recipient_email: 'arthur@valid.org', identifier: 'TEST-01', custom_notes: 'Valid recipient 1' },
  { recipient_name: 'Failure Simulation Target', recipient_email: 'fail_test@example.com', identifier: 'TEST-02', custom_notes: 'Simulated runtime error' },
  { recipient_name: 'Beatrice Vance', recipient_email: 'beatrice@valid.org', identifier: 'TEST-03', custom_notes: 'Valid recipient 2 (must succeed!)' },
  { recipient_name: 'Charles Xavier', recipient_email: 'charles@valid.org', identifier: 'TEST-04', custom_notes: 'Valid recipient 3 (must succeed!)' },
];

export const BulkJobCreator: React.FC<BulkJobCreatorProps> = ({ onSubmitJob, isSubmitting }) => {
  const [title, setTitle] = useState('Distributed Systems & Cloud Architecture');
  const [issuerName, setIssuerName] = useState('Apex Institute of Technology');
  const [issuerTitle, setIssuerTitle] = useState('Chief Academic Officer');
  const [issueDate, setIssueDate] = useState('October 7, 2026');
  const [editorMode, setEditorMode] = useState<'table' | 'csv'>('table');
  const [csvText, setCsvText] = useState('');
  const [recipients, setRecipients] = useState<RecipientInput[]>(PRESET_BOOTCAMP);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAddRecipient = () => {
    setRecipients([
      ...recipients,
      { recipient_name: '', recipient_email: '', identifier: '', custom_notes: '' },
    ]);
  };

  const handleUpdateRecipient = (index: number, field: keyof RecipientInput, value: string) => {
    const updated = [...recipients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipients(updated);
  };

  const handleRemoveRecipient = (index: number) => {
    if (recipients.length <= 1) return;
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleParseCsv = () => {
    try {
      const lines = csvText.trim().split('\n');
      const parsed: RecipientInput[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        if (i === 0 && line.toLowerCase().includes('name') && line.toLowerCase().includes('email')) {
          continue;
        }

        const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length >= 2) {
          parsed.push({
            recipient_name: cols[0],
            recipient_email: cols[1],
            identifier: cols[2] || undefined,
            custom_notes: cols[3] || undefined,
          });
        }
      }

      if (parsed.length === 0) {
        setValidationError('No valid recipient rows found in CSV. Format: Name, Email, ID, Notes');
        return;
      }

      setRecipients(parsed);
      setEditorMode('table');
      setValidationError(null);
    } catch (err: any) {
      setValidationError('CSV Parsing error: ' + err.message);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim()) {
      setValidationError('Course or Event title is required.');
      return;
    }
    if (!issuerName.trim()) {
      setValidationError('Issuer Organization name is required.');
      return;
    }
    if (recipients.length === 0) {
      setValidationError('At least one recipient is required.');
      return;
    }

    // Client-side pre-validation
    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      if (!r.recipient_name.trim()) {
        setValidationError(`Recipient #${i + 1} has an empty name.`);
        return;
      }
      if (!r.recipient_email.trim() || !r.recipient_email.includes('@')) {
        setValidationError(`Recipient #${i + 1} (${r.recipient_name || 'unnamed'}) has an invalid email: "${r.recipient_email}".`);
        return;
      }
    }

    onSubmitJob({
      title: title.trim(),
      issuer_name: issuerName.trim(),
      issuer_title: issuerTitle.trim() || 'Authorized Signatory',
      issue_date: issueDate.trim() || 'October 7, 2026',
      template_name: 'standard_landscape',
      recipients: recipients.map((r) => ({
        recipient_name: r.recipient_name.trim(),
        recipient_email: r.recipient_email.trim(),
        identifier: r.identifier?.trim() || undefined,
        custom_notes: r.custom_notes?.trim() || undefined,
      })),
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Top Banner with Presets */}
      <div className="bg-slate-800/40 p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>Create Bulk Generation Job</span>
          </h2>
          <p className="text-xs text-slate-400">
            Define certification credentials and dispatch batch generation to the asynchronous worker pool.
          </p>
        </div>

        {/* Preset loaders */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
          <button
            type="button"
            onClick={() => {
              setRecipients(PRESET_BOOTCAMP);
              setTitle('Distributed Systems & Cloud Architecture');
              setValidationError(null);
            }}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            Bootcamp (8)
          </button>
          <button
            type="button"
            onClick={() => {
              setRecipients(PRESET_EXECUTIVE);
              setTitle('Executive Leadership & Governance');
              setValidationError(null);
            }}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
          >
            <GraduationCap className="w-3 h-3 text-emerald-400" />
            Executive (4)
          </button>
          <button
            type="button"
            onClick={() => {
              setRecipients(PRESET_RESILIENCE_TEST);
              setTitle('Resilience & Fault-Tolerant Systems');
              setValidationError(null);
            }}
            className="px-2.5 py-1 text-xs rounded-md bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border border-amber-800/60 flex items-center gap-1 transition-colors"
            title="Includes a simulated recipient failure to demonstrate error isolation"
          >
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            Fault Isolation Demo (4)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-6">
        {/* Certificate Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Course / Event Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Systems & Cloud Architecture"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Issuing Organization *
            </label>
            <input
              type="text"
              value={issuerName}
              onChange={(e) => setIssuerName(e.target.value)}
              placeholder="e.g. Apex Institute of Technology"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Signatory Role / Title
            </label>
            <input
              type="text"
              value={issuerTitle}
              onChange={(e) => setIssuerTitle(e.target.value)}
              placeholder="e.g. Dean of Engineering"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Issue Date
            </label>
            <input
              type="text"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              placeholder="e.g. October 7, 2026"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Recipients Section Header */}
        <div className="border-t border-slate-800 pt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-white">
                Recipients List ({recipients.length})
              </h3>
              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setEditorMode('table')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    editorMode === 'table' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Table Editor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditorMode('csv');
                    setCsvText(
                      recipients
                        .map((r) => `"${r.recipient_name}","${r.recipient_email}","${r.identifier || ''}","${r.custom_notes || ''}"`)
                        .join('\n')
                    );
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    editorMode === 'csv' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  CSV / Bulk Paste
                </button>
              </div>
            </div>

            {editorMode === 'table' && (
              <button
                type="button"
                onClick={handleAddRecipient}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 flex items-center gap-1.5 transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Recipient
              </button>
            )}
          </div>

          {/* Table Editor */}
          {editorMode === 'table' ? (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-10">#</th>
                    <th className="py-2.5 px-3">Recipient Name *</th>
                    <th className="py-2.5 px-3">Email Address *</th>
                    <th className="py-2.5 px-3">Badge / ID (Optional)</th>
                    <th className="py-2.5 px-3">Distinction / Notes</th>
                    <th className="py-2.5 px-3 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recipients.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2 px-3 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={r.recipient_name}
                          onChange={(e) => handleUpdateRecipient(idx, 'recipient_name', e.target.value)}
                          placeholder="Full Name"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="email"
                          value={r.recipient_email}
                          onChange={(e) => handleUpdateRecipient(idx, 'recipient_email', e.target.value)}
                          placeholder="user@example.com"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={r.identifier || ''}
                          onChange={(e) => handleUpdateRecipient(idx, 'identifier', e.target.value)}
                          placeholder="e.g. ID-102"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={r.custom_notes || ''}
                          onChange={(e) => handleUpdateRecipient(idx, 'custom_notes', e.target.value)}
                          placeholder="e.g. Honors"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(idx)}
                          disabled={recipients.length <= 1}
                          className="text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500 p-1"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* CSV / Bulk Paste View */
            <div className="space-y-3">
              <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-slate-300">CSV Format:</span>{' '}
                <code className="text-amber-300 font-mono">Recipient Name, Recipient Email, [Optional ID], [Optional Notes]</code>
                <p className="mt-1 text-slate-500">Paste multiple rows below or click "Import into Table" to parse.</p>
              </div>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={7}
                placeholder={`Jane Doe, jane@example.com, STU-101, High Honors\nJohn Smith, john@example.com, STU-102, Pass`}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleParseCsv}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Parse & Load into Table
              </button>
            </div>
          )}
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Validation Error:</span> {validationError}
            </div>
          </div>
        )}

        {/* Footer Submission Bar */}
        <div className="border-t border-slate-800 pt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>
              Engine: <strong className="text-slate-200">Async Background Worker</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span>
              Format: <strong className="text-amber-400">Vector PDF & Bulk ZIP</strong>
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all transform active:scale-95"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Dispatching Batch Job...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Generate {recipients.length} Certificates in Bulk</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
