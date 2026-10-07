import React from 'react';
import {
  Layers,
  Cpu,
  Database,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Zap,
  Server,
} from 'lucide-react';

export const ArchitectureGuide: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              System Architecture & Interview Design Justifications
            </h2>
            <p className="text-xs text-slate-400">
              Technical trade-offs, concurrency models, data integrity strategies, and scaling decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Key Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Bulk Processing & Asynchronous Execution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Zap className="w-4 h-4" />
            <span>1. Bulk Processing & Async Concurrency</span>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed space-y-2">
            <p>
              <strong>The Problem:</strong> Generating 500+ vector PDF certificates takes 10–30 seconds.
              A synchronous HTTP request would hit gateway timeouts (e.g. 30s) and degrade client responsiveness.
            </p>
            <p>
              <strong>The Design Choice:</strong> Asynchronous Background Task Model with Polling.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>
                <strong className="text-slate-200">202 Accepted:</strong> Job record is committed to the relational store,
                returning immediately with a <code className="text-amber-300 font-mono">job_id</code> and tracking URL.
              </li>
              <li>
                <strong className="text-slate-200">Worker Execution:</strong> Background task iterates through
                recipients, updating atomic progress counters (<code className="text-amber-300 font-mono">completed_count</code>,{' '}
                <code className="text-amber-300 font-mono">failed_count</code>).
              </li>
              <li>
                <strong className="text-slate-200">Interview Evolution:</strong> For a distributed multi-node fleet,
                the background worker cleanly decouples into a distributed task broker like <em>Celery + Redis</em> or <em>AWS SQS</em>.
              </li>
            </ul>
          </div>
        </div>

        {/* 2. Error Isolation & Fault Tolerance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>2. Failure Handling & Fault Isolation</span>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed space-y-2">
            <p>
              <strong>Requirement:</strong> A failure while generating one certificate must never abort or block
              other valid certificates in the batch.
            </p>
            <p>
              <strong>Implementation Strategy:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>
                <strong className="text-slate-200">Isolated Try/Catch per Recipient:</strong> If a recipient has corrupted data
                or triggers an exception, the error is caught locally.
              </li>
              <li>
                <strong className="text-slate-200">Granular Recipient Status:</strong> That recipient's status becomes{' '}
                <span className="text-rose-400 font-semibold">FAILED</span> with the exact stack trace / error message recorded.
              </li>
              <li>
                <strong className="text-slate-200">State Enum Hierarchy:</strong> Overall job finishes as{' '}
                <span className="text-amber-400 font-semibold">PARTIAL_SUCCESS</span> if at least one succeeded and one failed,
                allowing clients to inspect specific failures while retrieving valid certificates in a ZIP bundle.
              </li>
            </ul>
          </div>
        </div>

        {/* 3. Relational Database Design */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Database className="w-4 h-4" />
            <span>3. Relational Schema & Storage Engine</span>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed space-y-2">
            <p>
              <strong>Relational Modeling:</strong> Clear 1-to-Many relational hierarchy between <code className="text-cyan-300 font-mono">jobs</code> and <code className="text-cyan-300 font-mono">certificates</code> tables.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>
                <strong className="text-slate-200">Foreign Keys:</strong> Enforced with foreign keys and <code className="font-mono text-cyan-300">ON DELETE CASCADE</code>.
              </li>
              <li>
                <strong className="text-slate-200">Concurrency:</strong> SQLite in <strong>WAL mode (Write-Ahead Logging)</strong> enables non-blocking concurrent reads while the worker process commits progress.
              </li>
              <li>
                <strong className="text-slate-200">Indexes:</strong> Indexes placed on <code className="font-mono text-cyan-300">certificates(job_id)</code>, <code className="font-mono text-cyan-300">certificates(status)</code>, and <code className="font-mono text-cyan-300">verification_code</code> for $O(1)$ lookups.
              </li>
            </ul>
          </div>
        </div>

        {/* 4. PDF Generation Performance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
            <FileText className="w-4 h-4" />
            <span>4. PDF Generation Engine: Vector Stream</span>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed space-y-2">
            <p>
              <strong>Engine Comparison:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>
                <strong className="text-slate-200">Headless Chromium (Puppeteer / Weasyprint):</strong> 200MB+ memory per process, slow cold-starts (~800ms per PDF), CPU heavy.
              </li>
              <li>
                <strong className="text-emerald-300">Direct Vector Generation (ReportLab / jsPDF):</strong> Direct vector canvas stream. Renders complete vector layout in &lt;15ms per certificate with &lt;15KB file size and zero external browser runtime.
              </li>
              <li>
                <strong className="text-slate-200">Vector Quality:</strong> High-DPI scalable text, ornamental guilloche borders, and cryptographic verification IDs.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Production Scaling Roadmap */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-amber-400" />
          <span>Production Scaling Roadmap (100,000+ Certificates / Day)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-200">1. Cloud Object Storage</span>
            <p className="text-slate-400">
              Swap local filesystem for Amazon S3 or Google Cloud Storage. Deliver certificates via pre-signed S3 URLs or CloudFront CDN to eliminate web server I/O bottlenecks.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-200">2. Distributed Workers</span>
            <p className="text-slate-400">
              Use Celery with Redis or AWS SQS. Partition large batches of 10,000 recipients across auto-scaled worker containers running in parallel.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-200">3. Webhooks & Email Delivery</span>
            <p className="text-slate-400">
              Notify clients when job finishes via HTTP Webhook payload. Optionally trigger transactional email dispatch (SendGrid / AWS SES) attaching the personalized PDF certificate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
