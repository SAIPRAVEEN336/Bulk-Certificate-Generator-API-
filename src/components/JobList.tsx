import React from 'react';
import {
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileArchive,
  Eye,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Job } from '../types';

interface JobListProps {
  jobs: Job[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
  filterStatus: string | null;
  setFilterStatus: (status: string | null) => void;
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
  filterStatus,
  setFilterStatus,
}) => {
  const filteredJobs = filterStatus
    ? jobs.filter((j) => j.status === filterStatus)
    : jobs;

  const getStatusBadge = (status: Job['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            COMPLETED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1">
            <div className="w-2.5 h-2.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
            PROCESSING
          </span>
        );
      case 'QUEUED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            QUEUED
          </span>
        );
      case 'PARTIAL_SUCCESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            PARTIAL SUCCESS
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">
            Generation Jobs Output & History ({jobs.length})
          </h3>
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setFilterStatus(null)}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterStatus === null ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('COMPLETED')}
            className={`px-2 py-1 rounded-md transition-colors ${
              filterStatus === 'COMPLETED' ? 'bg-emerald-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilterStatus('PROCESSING')}
            className={`px-2 py-1 rounded-md transition-colors ${
              filterStatus === 'PROCESSING' ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus('PARTIAL_SUCCESS')}
            className={`px-2 py-1 rounded-md transition-colors ${
              filterStatus === 'PARTIAL_SUCCESS' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Partial
          </button>
        </div>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="p-12 text-center text-slate-500">
          <Layers className="w-10 h-10 mx-auto text-slate-700 mb-3 stroke-[1.5]" />
          <p className="text-sm font-medium text-slate-400">No generation jobs found matching filter</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/80">
          {filteredJobs.map((job) => {
            const isSelected = selectedJobId === job.id;
            return (
              <div
                key={job.id}
                className={`p-4 transition-all hover:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSelected ? 'bg-amber-500/5 border-l-4 border-amber-500' : ''
                }`}
              >
                {/* Left Metadata */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-white truncate max-w-md">
                      {job.title}
                    </span>
                    {getStatusBadge(job.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>
                      Issuer: <strong className="text-slate-300">{job.issuer_name}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Date: <strong className="text-slate-300">{job.issue_date}</strong>
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      Job ID: {job.id.slice(0, 16)}...
                    </span>
                  </div>

                  {/* Progress Bar & Counters */}
                  <div className="space-y-1 pt-1 max-w-md">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        Progress: <strong className="text-slate-200">{job.progress_percentage}%</strong> (
                        {job.completed_count}/{job.total_recipients} generated
                        {job.failed_count > 0 && (
                          <span className="text-rose-400 ml-1">, {job.failed_count} failed</span>
                        )}
                        )
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{
                          width: `${(job.completed_count / (job.total_recipients || 1)) * 100}%`,
                        }}
                      ></div>
                      {job.failed_count > 0 && (
                        <div
                          className="h-full bg-rose-500 transition-all duration-300"
                          style={{
                            width: `${(job.failed_count / (job.total_recipients || 1)) * 100}%`,
                          }}
                        ></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {job.completed_count > 0 && job.zipUrl && (
                    <a
                      href={job.zipUrl}
                      download={`Certificates_${job.title.replace(/\s+/g, '_')}_${job.id.slice(0, 8)}.zip`}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                      title="Download all certificates in a ZIP bundle"
                    >
                      <FileArchive className="w-3.5 h-3.5" />
                      <span>Download ZIP</span>
                    </a>
                  )}

                  <button
                    onClick={() => onSelectJob(job.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect & Output</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
