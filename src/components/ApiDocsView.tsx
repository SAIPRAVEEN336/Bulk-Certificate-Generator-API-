import React, { useState } from 'react';
import { Code, Copy, Check, Terminal, BookOpen } from 'lucide-react';

export const ApiDocsView: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const curlCreateJob = `curl -X POST "http://localhost:8000/api/jobs" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Distributed Systems & Cloud Architecture",
    "issuer_name": "Apex Institute of Technology",
    "issuer_title": "Dean of Engineering",
    "issue_date": "2026-10-07",
    "recipients": [
      {
        "recipient_name": "Alex Rivera",
        "recipient_email": "alex.rivera@example.com",
        "identifier": "ENG-2026-01",
        "custom_notes": "Valedictorian"
      },
      {
        "recipient_name": "Sophia Chen",
        "recipient_email": "sophia.chen@example.com",
        "identifier": "ENG-2026-02"
      }
    ]
  }'`;

  const pythonFastApiClient = `import requests
import time

BASE_URL = "http://localhost:8000/api"

# 1. Submit bulk certificate generation job
payload = {
    "title": "Distributed Systems & Cloud Architecture",
    "issuer_name": "Apex Institute of Technology",
    "issuer_title": "Dean of Engineering",
    "issue_date": "2026-10-07",
    "recipients": [
        {"recipient_name": "Alex Rivera", "recipient_email": "alex@example.com"},
        {"recipient_name": "Sophia Chen", "recipient_email": "sophia@example.com"}
    ]
}

response = requests.post(f"{BASE_URL}/jobs", json=payload)
job_id = response.json()["job_id"]
print(f"Job accepted with ID: {job_id}")

# 2. Poll job status until completed
while True:
    status_resp = requests.get(f"{BASE_URL}/jobs/{job_id}").json()
    status = status_resp["status"]
    print(f"Status: {status} ({status_resp['completed_count']}/{status_resp['total_recipients']})")
    if status in ["COMPLETED", "PARTIAL_SUCCESS", "FAILED"]:
        break
    time.sleep(1)

# 3. Retrieve all generated certificates bundled as a ZIP
zip_resp = requests.get(f"{BASE_URL}/jobs/{job_id}/download-zip")
with open("certificates.zip", "wb") as f:
    f.write(zip_resp.content)
print("Saved certificates.zip successfully!")`;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Backend REST API Specification & Integration Code
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              RESTful endpoints for submitting bulk generation jobs, polling status, and streaming individual PDFs or bundled ZIP archives.
            </p>
          </div>
        </div>
      </div>

      {/* Endpoints Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-800/40">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Core REST Endpoints
          </h3>
        </div>

        <div className="divide-y divide-slate-800/80 text-xs">
          {/* POST /api/jobs */}
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                POST
              </span>
              <code className="font-mono text-white text-sm">/api/jobs</code>
              <span className="text-slate-400 text-xs">— Submit bulk generation request</span>
              <span className="ml-auto text-emerald-400 font-mono text-[11px]">202 Accepted</span>
            </div>
            <p className="text-slate-400 text-xs">
              Accepts recipient list and course metadata. Dispatches job to background processing.
            </p>
          </div>

          {/* GET /api/jobs/{job_id} */}
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                GET
              </span>
              <code className="font-mono text-white text-sm">/api/jobs/{'{job_id}'}</code>
              <span className="text-slate-400 text-xs">— Poll job status and recipient details</span>
              <span className="ml-auto text-emerald-400 font-mono text-[11px]">200 OK</span>
            </div>
            <p className="text-slate-400 text-xs">
              Returns overall status, total, completed_count, failed_count, and per-recipient status with download URLs.
            </p>
          </div>

          {/* GET /api/jobs/{job_id}/download-zip */}
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                GET
              </span>
              <code className="font-mono text-white text-sm">/api/jobs/{'{job_id}'}/download-zip</code>
              <span className="text-slate-400 text-xs">— Download all generated certificates as a ZIP</span>
              <span className="ml-auto text-emerald-400 font-mono text-[11px]">application/zip</span>
            </div>
            <p className="text-slate-400 text-xs">
              Streams a compressed ZIP file bundling every completed PDF certificate in the job.
            </p>
          </div>

          {/* GET /api/certificates/{id}/download */}
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                GET
              </span>
              <code className="font-mono text-white text-sm">/api/certificates/{'{certificate_id}'}/download</code>
              <span className="text-slate-400 text-xs">— Download individual certificate PDF</span>
              <span className="ml-auto text-emerald-400 font-mono text-[11px]">application/pdf</span>
            </div>
            <p className="text-slate-400 text-xs">
              Streams the single generated vector PDF with attachment header.
            </p>
          </div>
        </div>
      </div>

      {/* Code Snippets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* cURL Example */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-3 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>cURL Job Submission</span>
            </div>
            <button
              onClick={() => copyToClipboard(curlCreateJob, 'curl')}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
              title="Copy snippet"
            >
              {copiedKey === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-amber-200/90 bg-slate-950 overflow-x-auto flex-1 leading-relaxed">
            {curlCreateJob}
          </pre>
        </div>

        {/* Python Requests Example */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-3 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Code className="w-4 h-4 text-sky-400" />
              <span>Python Client Integration</span>
            </div>
            <button
              onClick={() => copyToClipboard(pythonFastApiClient, 'python')}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
              title="Copy snippet"
            >
              {copiedKey === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-sky-200/90 bg-slate-950 overflow-x-auto flex-1 leading-relaxed">
            {pythonFastApiClient}
          </pre>
        </div>
      </div>
    </div>
  );
};
