import {
  BulkCertificateCreatePayload,
  JobCreatedResponse,
  JobDetail,
  JobListResponse,
  SystemHealth,
  TestRunResult,
} from './types';

const BASE_URL = '/api';

export async function fetchHealth(): Promise<SystemHealth> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Failed to reach backend health endpoint');
  return res.json();
}

export async function createJob(
  payload: BulkCertificateCreatePayload,
  sync = false
): Promise<JobCreatedResponse> {
  const res = await fetch(`${BASE_URL}/jobs?sync=${sync}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      typeof errorData.detail === 'string'
        ? errorData.detail
        : Array.isArray(errorData.detail)
        ? errorData.detail.map((e: any) => `${e.loc?.join('.') || 'field'}: ${e.msg}`).join(', ')
        : 'Failed to create certificate generation job';
    throw new Error(message);
  }
  return res.json();
}

export async function fetchJobs(page = 1, limit = 20, status?: string): Promise<JobListResponse> {
  let url = `${BASE_URL}/jobs?page=${page}&limit=${limit}`;
  if (status) url += `&status=${encodeURIComponent(status)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch jobs list');
  return res.json();
}

export async function fetchJobDetail(jobId: string): Promise<JobDetail> {
  const res = await fetch(`${BASE_URL}/jobs/${jobId}`);
  if (!res.ok) throw new Error(`Failed to fetch job detail for ${jobId}`);
  return res.json();
}

export async function runTestSuite(): Promise<TestRunResult> {
  const res = await fetch(`${BASE_URL}/tests/run`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to execute test suite');
  return res.json();
}
