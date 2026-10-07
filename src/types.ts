export interface RecipientInput {
  recipient_name: string;
  recipient_email: string;
  identifier?: string;
  custom_notes?: string;
}

export interface BulkCertificateCreatePayload {
  title: string;
  issuer_name: string;
  issuer_title: string;
  issue_date: string;
  template_name?: string;
  recipients: RecipientInput[];
}

export type CertificateStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export interface CertificateItem {
  id: string;
  job_id: string;
  recipient_name: string;
  recipient_email: string;
  identifier?: string;
  custom_notes?: string;
  status: CertificateStatus;
  error_message?: string;
  verification_code: string;
  file_size: number;
  pdfBlob?: Blob;
  pdfUrl?: string;
  svgContent?: string;
  created_at: string;
  updated_at: string;
}

export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL_SUCCESS' | 'FAILED';

export interface Job {
  id: string;
  title: string;
  issuer_name: string;
  issuer_title: string;
  issue_date: string;
  template_name: string;
  status: JobStatus;
  total_recipients: number;
  completed_count: number;
  failed_count: number;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  certificates: CertificateItem[];
  zipBlob?: Blob;
  zipUrl?: string;
}

export interface TestCaseResult {
  id: string;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'pending';
  durationMs: number;
  details: string;
}
