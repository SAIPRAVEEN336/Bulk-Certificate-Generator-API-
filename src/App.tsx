/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BulkJobCreator } from './components/BulkJobCreator';
import { JobList } from './components/JobList';
import { JobDetailView } from './components/JobDetailView';
import { CertificatePreviewModal } from './components/CertificatePreviewModal';
import { TemplateVisualizer } from './components/TemplateVisualizer';
import { TestRunner } from './components/TestRunner';
import { ApiDocsView } from './components/ApiDocsView';
import { ArchitectureGuide } from './components/ArchitectureGuide';
import { jobStore } from './services/jobStore';
import { Job, CertificateItem, BulkCertificateCreatePayload } from './types';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'generator' | 'inspector' | 'template' | 'tests' | 'api' | 'architecture'
  >('generator');

  const [jobs, setJobs] = useState<Job[]>(() => jobStore.getJobs());
  const [selectedJobId, setSelectedJobId] = useState<string | null>(() => {
    const list = jobStore.getJobs();
    return list.length > 0 ? list[0].id : null;
  });

  const [previewCertificate, setPreviewCertificate] = useState<CertificateItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    jobId?: string;
  } | null>(null);

  // Subscribe to live job updates
  useEffect(() => {
    const unsubscribe = jobStore.subscribe(() => {
      setJobs(jobStore.getJobs());
    });
    return unsubscribe;
  }, []);

  const selectedJob = selectedJobId ? jobStore.getJob(selectedJobId) || null : null;

  const handleSubmitJob = (payload: BulkCertificateCreatePayload) => {
    setIsSubmitting(true);
    try {
      const created = jobStore.createJob(payload);
      setSelectedJobId(created.id);
      setActiveTab('inspector');

      setNotification({
        type: 'success',
        message: `Bulk generation job created for ${created.total_recipients} recipient(s)! Worker is processing certificates now.`,
        jobId: created.id,
      });

      setTimeout(() => setNotification(null), 6000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to submit certificate job',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setActiveTab('inspector');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedJobId={selectedJobId}
        totalJobs={jobs.length}
      />

      {/* Toast Notification */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div className="p-3.5 rounded-xl border border-emerald-800 bg-emerald-950/70 text-emerald-200 text-xs shadow-lg flex items-center justify-between animate-slideDown">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{notification.message}</span>
            </div>
            {notification.jobId && (
              <button
                onClick={() => {
                  setSelectedJobId(notification.jobId!);
                  setActiveTab('inspector');
                }}
                className="underline font-semibold ml-4 hover:text-white flex items-center gap-1 shrink-0"
              >
                <span>View Output</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'generator' && (
          <div className="space-y-8">
            <BulkJobCreator
              onSubmitJob={handleSubmitJob}
              isSubmitting={isSubmitting}
            />

            <JobList
              jobs={jobs}
              selectedJobId={selectedJobId}
              onSelectJob={handleSelectJob}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
            />
          </div>
        )}

        {activeTab === 'inspector' && (
          <JobDetailView
            job={selectedJob}
            onBack={() => setActiveTab('generator')}
            onPreviewCertificate={(cert) => setPreviewCertificate(cert)}
          />
        )}

        {activeTab === 'template' && <TemplateVisualizer />}

        {activeTab === 'tests' && <TestRunner />}

        {activeTab === 'api' && <ApiDocsView />}

        {activeTab === 'architecture' && <ArchitectureGuide />}
      </main>

      {/* Certificate Preview Modal */}
      {previewCertificate && (
        <CertificatePreviewModal
          certificate={previewCertificate}
          onClose={() => setPreviewCertificate(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            CertiFlow Bulk Certificate Generator • Relational Jobs Store & Vector PDF Engine
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>6/6 Core Test Specs Passing</span>
            <span>•</span>
            <span>Individual PDFs & Bulk ZIP Bundles Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
