import React, { useState } from 'react';
import {
  FileArchive,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Award,
  Hash,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { Job, CertificateItem } from '../types';

interface JobDetailViewProps {
  job: Job | null;
  onBack: () => void;
  onPreviewCertificate: (cert: CertificateItem) => void;
}

export const JobDetailView: React.FC<JobDetailViewProps> = ({
  job,
  onBack,
  onPreviewCertificate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  if (!job) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-4">
        <p className="text-sm font-medium">No job currently selected for inspection.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const filteredRecipients = job.certificates.filter((r) => {
    const matchesSearch =
      r.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.verification_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Navigation & Title Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Back to Jobs"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{job.title}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {job.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Issued by <span className="text-slate-200">{job.issuer_name}</span> ({job.issuer_title}) • {job.issue_date}
              </p>
            </div>
          </div>

          {job.completed_count > 0 && job.zipUrl && (
            <a
              href={job.zipUrl}
              download={`Certificates_${job.title.replace(/\s+/g, '_')}_${job.id.slice(0, 8)}.zip`}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto"
            >
              <FileArchive className="w-4 h-4" />
              <span>Download Bulk ZIP ({job.completed_count} Certificates)</span>
            </a>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Recipients</span>
          <div className="text-2xl font-bold text-white mt-1">{job.total_recipients}</div>
        </div>
        <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl shadow-lg">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Generated Successfully</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{job.completed_count}</div>
        </div>
        <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-2xl shadow-lg">
          <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Failed Generation</span>
          <div className="text-2xl font-bold text-rose-400 mt-1">{job.failed_count}</div>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pass Rate</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {job.total_recipients > 0
              ? `${Math.round((job.completed_count / job.total_recipients) * 100)}%`
              : '0%'}
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search recipients by name, email, or verification ID..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Statuses ({job.certificates.length})</option>
              <option value="COMPLETED">Completed ({job.completed_count})</option>
              <option value="FAILED">Failed ({job.failed_count})</option>
              <option value="PENDING">Pending / Processing</option>
            </select>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Job UUID: {job.id}
          </div>
        </div>

        {/* Recipients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Recipient Name & Email</th>
                <th className="py-3 px-4">Verification ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">File Size</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecipients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    No recipients matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecipients.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100">{cert.recipient_name}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{cert.recipient_email}</div>
                      {cert.custom_notes && (
                        <span className="inline-block mt-0.5 text-[10px] text-amber-400/90 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                          ★ {cert.custom_notes}
                        </span>
                      )}
                      {cert.error_message && (
                        <div className="mt-1.5 text-[11px] text-rose-300 bg-rose-950/40 p-2 rounded-lg border border-rose-900/60 max-w-xl">
                          <strong className="text-rose-400">Isolated Failure:</strong> {cert.error_message}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {cert.verification_code}
                    </td>
                    <td className="py-3 px-4">
                      {cert.status === 'COMPLETED' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          COMPLETED
                        </span>
                      )}
                      {cert.status === 'GENERATING' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30 inline-flex items-center gap-1">
                          <div className="w-2 h-2 border border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                          GENERATING
                        </span>
                      )}
                      {cert.status === 'PENDING' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          PENDING
                        </span>
                      )}
                      {cert.status === 'FAILED' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          FAILED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {cert.file_size > 0 ? `${(cert.file_size / 1024).toFixed(1)} KB` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {cert.status === 'COMPLETED' && cert.pdfUrl ? (
                          <>
                            <button
                              onClick={() => onPreviewCertificate(cert)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                              title="Preview certificate in high resolution"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              <span>View</span>
                            </button>
                            <a
                              href={cert.pdfUrl}
                              download={`Certificate_${cert.recipient_name.replace(/\s+/g, '_')}_${cert.verification_code}.pdf`}
                              className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download PDF</span>
                            </a>
                          </>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
