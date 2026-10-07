import {
  BulkCertificateCreatePayload,
  CertificateItem,
  Job,
  JobStatus,
  RecipientInput,
} from '../types';
import {
  generateVerificationCode,
  generateCertificatePdfBlob,
  generateCertificateSvg,
  generateBulkZip,
} from './certificateGenerator';

const STORAGE_KEY = 'certiflow_jobs_data';

// Initial pre-seeded jobs for immediate output visualization
function getInitialSeedJobs(): Job[] {
  const job1Id = 'job-seed-2026-bootcamp';
  const job1Title = 'Distributed Systems & Cloud Architecture';
  const job1Issuer = 'Apex Institute of Technology';
  const job1TitleSignatory = 'Chief Academic Officer';
  const job1Date = 'October 7, 2026';

  const recipients1 = [
    { name: 'Alex Rivera', email: 'alex.rivera@example.com', id: 'ENG-2026-01', notes: 'Valedictorian' },
    { name: 'Sophia Chen', email: 'sophia.chen@example.com', id: 'ENG-2026-02', notes: 'High Honors' },
    { name: 'Marcus Brody', email: 'marcus.b@example.com', id: 'ENG-2026-03' },
    { name: 'Elena Rostova', email: 'elena.rostova@example.com', id: 'ENG-2026-04', notes: 'Distinction' },
    { name: 'Liam Gallagher', email: 'liam.g@example.com', id: 'ENG-2026-05' },
    { name: 'Nadia Patel', email: 'nadia.patel@example.com', id: 'ENG-2026-06', notes: 'Capstone Winner' },
  ];

  const certs1: CertificateItem[] = recipients1.map((r, idx) => {
    const code = generateVerificationCode(r.email, job1Id, idx);
    const pdfBlob = generateCertificatePdfBlob(
      { recipient_name: r.name, identifier: r.id, custom_notes: r.notes, verification_code: code },
      { title: job1Title, issuer_name: job1Issuer, issuer_title: job1TitleSignatory, issue_date: job1Date }
    );
    const svg = generateCertificateSvg(
      { recipient_name: r.name, recipient_email: r.email, identifier: r.id, custom_notes: r.notes, verification_code: code },
      { title: job1Title, issuer_name: job1Issuer, issuer_title: job1TitleSignatory, issue_date: job1Date }
    );

    return {
      id: `cert-seed-1-${idx + 1}`,
      job_id: job1Id,
      recipient_name: r.name,
      recipient_email: r.email,
      identifier: r.id,
      custom_notes: r.notes,
      status: 'COMPLETED',
      verification_code: code,
      file_size: pdfBlob.size,
      pdfBlob,
      pdfUrl: URL.createObjectURL(pdfBlob),
      svgContent: svg,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3500000).toISOString(),
    };
  });

  const job1: Job = {
    id: job1Id,
    title: job1Title,
    issuer_name: job1Issuer,
    issuer_title: job1TitleSignatory,
    issue_date: job1Date,
    template_name: 'standard_landscape',
    status: 'COMPLETED',
    total_recipients: certs1.length,
    completed_count: certs1.length,
    failed_count: 0,
    progress_percentage: 100,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3500000).toISOString(),
    certificates: certs1,
  };

  // Pre-generate ZIP for job 1
  generateBulkZip(job1).then((zipBlob) => {
    job1.zipBlob = zipBlob;
    job1.zipUrl = URL.createObjectURL(zipBlob);
  });

  // Job 2: Partial Success demonstration to show fault isolation
  const job2Id = 'job-seed-2026-fault-demo';
  const job2Title = 'Resilience & Fault-Tolerant Systems';
  const job2Issuer = 'Global Cloud Academy';
  const job2TitleSignatory = 'Director of Infrastructure';
  const job2Date = 'October 6, 2026';

  const recipients2 = [
    { name: 'Arthur Pendelton', email: 'arthur.p@valid.org', id: 'SEC-101', notes: 'Valid Recipient 1', shouldFail: false },
    { name: 'Corrupted Syntax Target', email: 'fail_test@invalid-host.demo', id: 'SEC-102', notes: 'Simulated runtime error', shouldFail: true },
    { name: 'Beatrice Vance', email: 'beatrice.v@valid.org', id: 'SEC-103', notes: 'Valid Recipient 2', shouldFail: false },
  ];

  const certs2: CertificateItem[] = recipients2.map((r, idx) => {
    const code = generateVerificationCode(r.email, job2Id, idx);
    if (r.shouldFail) {
      return {
        id: `cert-seed-2-${idx + 1}`,
        job_id: job2Id,
        recipient_name: r.name,
        recipient_email: r.email,
        identifier: r.id,
        custom_notes: r.notes,
        status: 'FAILED',
        error_message: 'RecipientExecutionError: Simulated failure trigger - corrupted schema encoding',
        verification_code: code,
        file_size: 0,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 7100000).toISOString(),
      };
    }

    const pdfBlob = generateCertificatePdfBlob(
      { recipient_name: r.name, identifier: r.id, custom_notes: r.notes, verification_code: code },
      { title: job2Title, issuer_name: job2Issuer, issuer_title: job2TitleSignatory, issue_date: job2Date }
    );
    const svg = generateCertificateSvg(
      { recipient_name: r.name, recipient_email: r.email, identifier: r.id, custom_notes: r.notes, verification_code: code },
      { title: job2Title, issuer_name: job2Issuer, issuer_title: job2TitleSignatory, issue_date: job2Date }
    );

    return {
      id: `cert-seed-2-${idx + 1}`,
      job_id: job2Id,
      recipient_name: r.name,
      recipient_email: r.email,
      identifier: r.id,
      custom_notes: r.notes,
      status: 'COMPLETED',
      verification_code: code,
      file_size: pdfBlob.size,
      pdfBlob,
      pdfUrl: URL.createObjectURL(pdfBlob),
      svgContent: svg,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 7100000).toISOString(),
    };
  });

  const job2: Job = {
    id: job2Id,
    title: job2Title,
    issuer_name: job2Issuer,
    issuer_title: job2TitleSignatory,
    issue_date: job2Date,
    template_name: 'standard_landscape',
    status: 'PARTIAL_SUCCESS',
    total_recipients: certs2.length,
    completed_count: 2,
    failed_count: 1,
    progress_percentage: 100,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7100000).toISOString(),
    certificates: certs2,
  };

  generateBulkZip(job2).then((zipBlob) => {
    job2.zipBlob = zipBlob;
    job2.zipUrl = URL.createObjectURL(zipBlob);
  });

  return [job1, job2];
}

class JobStore {
  private jobs: Job[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.jobs = getInitialSeedJobs();
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getJobs(): Job[] {
    return [...this.jobs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getJob(id: string): Job | undefined {
    return this.jobs.find((j) => j.id === id);
  }

  public createJob(payload: BulkCertificateCreatePayload): Job {
    const jobId = `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const certificates: CertificateItem[] = payload.recipients.map((r, idx) => ({
      id: `cert-${jobId}-${idx + 1}`,
      job_id: jobId,
      recipient_name: r.recipient_name,
      recipient_email: r.recipient_email,
      identifier: r.identifier,
      custom_notes: r.custom_notes,
      status: 'PENDING',
      verification_code: generateVerificationCode(r.recipient_email, jobId, idx),
      file_size: 0,
      created_at: now,
      updated_at: now,
    }));

    const newJob: Job = {
      id: jobId,
      title: payload.title,
      issuer_name: payload.issuer_name,
      issuer_title: payload.issuer_title,
      issue_date: payload.issue_date,
      template_name: payload.template_name || 'standard_landscape',
      status: 'QUEUED',
      total_recipients: certificates.length,
      completed_count: 0,
      failed_count: 0,
      progress_percentage: 0,
      created_at: now,
      updated_at: now,
      certificates,
    };

    this.jobs.unshift(newJob);
    this.notify();

    // Start background processing
    this.processJobAsync(jobId);

    return newJob;
  }

  public async processJobAsync(jobId: string) {
    const job = this.getJob(jobId);
    if (!job) return;

    job.status = 'PROCESSING';
    job.updated_at = new Date().toISOString();
    this.notify();

    let completed = 0;
    let failed = 0;

    for (let i = 0; i < job.certificates.length; i++) {
      const cert = job.certificates[i];
      cert.status = 'GENERATING';
      this.notify();

      // Simulated micro-delay for realistic bulk worker progress
      await new Promise((resolve) => setTimeout(resolve, 150));

      try {
        // Simulated failure triggers for resilience testing
        if (
          cert.recipient_email.toLowerCase().includes('fail_test') ||
          cert.recipient_email.toLowerCase().includes('error_sim')
        ) {
          throw new Error('Simulated failure trigger for recipient testing');
        }

        // Validate basic email format
        if (!cert.recipient_email.includes('@') || !cert.recipient_email.includes('.')) {
          throw new Error(`Invalid email syntax: "${cert.recipient_email}"`);
        }

        // Generate vector PDF & SVG
        const pdfBlob = generateCertificatePdfBlob(
          {
            recipient_name: cert.recipient_name,
            identifier: cert.identifier,
            custom_notes: cert.custom_notes,
            verification_code: cert.verification_code,
          },
          {
            title: job.title,
            issuer_name: job.issuer_name,
            issuer_title: job.issuer_title,
            issue_date: job.issue_date,
          }
        );

        const svg = generateCertificateSvg(
          {
            recipient_name: cert.recipient_name,
            recipient_email: cert.recipient_email,
            identifier: cert.identifier,
            custom_notes: cert.custom_notes,
            verification_code: cert.verification_code,
          },
          {
            title: job.title,
            issuer_name: job.issuer_name,
            issuer_title: job.issuer_title,
            issue_date: job.issue_date,
          }
        );

        cert.status = 'COMPLETED';
        cert.pdfBlob = pdfBlob;
        cert.pdfUrl = URL.createObjectURL(pdfBlob);
        cert.svgContent = svg;
        cert.file_size = pdfBlob.size;
        cert.updated_at = new Date().toISOString();
        completed++;
      } catch (err: any) {
        // Fault isolation: failure on this recipient does not abort the rest of the batch
        cert.status = 'FAILED';
        cert.error_message = err.message || 'Generation error';
        cert.updated_at = new Date().toISOString();
        failed++;
      }

      job.completed_count = completed;
      job.failed_count = failed;
      job.progress_percentage = Math.round(((completed + failed) / job.total_recipients) * 100);
      job.updated_at = new Date().toISOString();
      this.notify();
    }

    // Determine final status
    if (completed === job.total_recipients) {
      job.status = 'COMPLETED';
    } else if (completed > 0 && failed > 0) {
      job.status = 'PARTIAL_SUCCESS';
    } else if (failed === job.total_recipients) {
      job.status = 'FAILED';
    } else {
      job.status = 'COMPLETED';
    }

    // Generate ZIP bundle if at least one certificate completed
    if (completed > 0) {
      try {
        const zipBlob = await generateBulkZip(job);
        job.zipBlob = zipBlob;
        job.zipUrl = URL.createObjectURL(zipBlob);
      } catch (e) {
        console.error('Failed to generate ZIP bundle:', e);
      }
    }

    job.updated_at = new Date().toISOString();
    this.notify();
  }
}

export const jobStore = new JobStore();
