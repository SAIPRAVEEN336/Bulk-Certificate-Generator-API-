import React, { useState } from 'react';
import {
  X,
  FileArchive,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  RefreshCw,
  Award,
  Hash,
  ExternalLink,
} from 'lucide-react';
import { JobDetail, CertificateItem } from '../types';

interface JobDetailModalProps {
  job: JobDetail | null;
  onClose: () => void;
  onRefresh: () => void;
  onPreviewCertificate: (cert: CertificateItem) => void;
  isLoading: boolean;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  onClose,
  onRefresh,
  onPreviewCertificate,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  if (!job) return null;

  const filteredRecipients = job.recipients.filter((r) => {
    const matchesSearch =
      r.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.verification_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-800/40 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">{job.title}</h2>
                <p className="text-xs text-slate-400">
                  Issued by <span className="text-slate-200">{job.issuer_name}</span> ({job.issuer_title}) • {job.issue_date}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Refresh job status"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Job Metrics Cards */}
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/50 border-b border-slate-800">
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Recipients</span>
            <div className="text-xl font-bold text-white mt-1">{job.total_recipients}</div>
          </div>
          <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Completed</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">{job.completed_count}</div>
          </div>
          <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl">
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Failed</span>
            <div className="text-xl font-bold text-rose-400 mt-1">{job.failed_count}</div>
          </div>
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overall Status</span>
            <div className="text-sm font-bold text-amber-400 mt-1.5 flex items-center gap-1.5">
              <span>{job.status}</span>
            </div>
          </div>
        </div>

        {/* Bulk Action & Search Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search recipients by name, email, or verification code..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed Only</option>
              <option value="FAILED">Failed Only</option>
              <option value="PENDING">Pending Only</option>
            </select>
          </div>

          {job.completed_count > 0 && (
            <a
              href={`/api/jobs/${job.id}/download-zip`}
              download
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-2 shadow-lg shadow-amber-500/10 transition-colors"
            >
              <FileArchive className="w-4 h-4" />
              <span>Download Bulk ZIP ({job.completed_count} Certificates)</span>
            </a>
          )}
        </div>

        {/* Recipients Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Verification ID</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">File Size</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecipients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No recipients matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRecipients.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-100">{cert.recipient_name}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{cert.recipient_email}</div>
                        {cert.custom_notes && (
                          <span className="inline-block mt-0.5 text-[10px] text-amber-400/90 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                            ★ {cert.custom_notes}
                          </span>
                        )}
                        {cert.error_message && (
                          <div className="mt-1 text-[11px] text-rose-400 bg-rose-950/40 p-1.5 rounded border border-rose-900/50">
                            <strong>Failure reason:</strong> {cert.error_message}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {cert.verification_code}
                      </td>
                      <td className="py-2.5 px-3">
                        {cert.status === 'COMPLETED' && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            COMPLETED
                          </span>
                        )}
                        {cert.status === 'GENERATING' && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30 inline-flex items-center gap-1">
                            <div className="w-2 h-2 border border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                            GENERATING
                          </span>
                        )}
                        {cert.status === 'PENDING' && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            PENDING
                          </span>
                        )}
                        {cert.status === 'FAILED' && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            FAILED
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {cert.file_size > 0 ? `${(cert.file_size / 1024).toFixed(1)} KB` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {cert.status === 'COMPLETED' ? (
                            <>
                              <button
                                onClick={() => onPreviewCertificate(cert)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                                title="Preview certificate"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-400" />
                                <span>Preview</span>
                              </button>
                              <a
                                href={`/api/certificates/${cert.id}/download`}
                                download
                                className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                title="Download PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>PDF</span>
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

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
          <div>
            Job UUID: <code className="text-slate-300 font-mono">{job.id}</code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
