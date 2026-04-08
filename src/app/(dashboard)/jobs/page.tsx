"use client";

import { useEffect, useState } from "react";

interface ApiEnvelope<T> { success: boolean; data?: T; reason?: string; message?: string }

type JobsPayload = {
  importJobs: Array<{ id: string; filename: string; status: string; stage: string; progress: number; totalRows: number; importedRows: number; duplicateRows: number; invalidRows: number; errorRows: number; createdAt: string; updatedAt: string }>;
  jobRuns: Array<{ id: string; jobType: string; status: string; stage?: string | null; progress: number; successCount: number; failureCount: number; createdAt: string; updatedAt: string }>;
};

export default function JobsPage() {
  const [data, setData] = useState<JobsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/jobs');
        const json = (await res.json()) as ApiEnvelope<JobsPayload>;
        if (!res.ok || !json.success || !json.data) throw new Error(json.message || json.reason || 'Failed to load jobs');
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
      }
    };
    void load();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      <h1 className="font-headline text-5xl font-bold display-tight text-white">Pipeline Jobs</h1>
      {error && <div className="rounded border border-tertiary/30 bg-tertiary/10 p-3 text-sm text-tertiary">{error}</div>}
      <section className="rounded-xl bg-surface-container p-4 space-y-3">
        <h2 className="text-lg font-semibold">Import jobs</h2>
        {(data?.importJobs || []).map((job) => (
          <div key={job.id} className="rounded border border-outline-variant/10 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{job.filename}</p>
              <span>{job.status}</span>
            </div>
            <p className="text-muted-foreground">Stage: {job.stage} • Progress: {job.progress}%</p>
            <p className="text-muted-foreground">Imported {job.importedRows}/{job.totalRows}, duplicates {job.duplicateRows}, invalid {job.invalidRows}, errors {job.errorRows}</p>
          </div>
        ))}
      </section>
      <section className="rounded-xl bg-surface-container p-4 space-y-3">
        <h2 className="text-lg font-semibold">Operational jobs</h2>
        {(data?.jobRuns || []).map((job) => (
          <div key={job.id} className="rounded border border-outline-variant/10 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{job.jobType}</p>
              <span>{job.status}</span>
            </div>
            <p className="text-muted-foreground">Stage: {job.stage || '-'} • Progress: {job.progress}%</p>
            <p className="text-muted-foreground">Success {job.successCount}, failures {job.failureCount}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

