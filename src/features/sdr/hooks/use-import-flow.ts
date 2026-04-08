"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  reason?: string;
  message?: string;
}

interface ImportJob {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  stage: string;
  progress: number;
  importedRows: number;
  duplicateRows: number;
  invalidRows: number;
  errorRows: number;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || json.reason || `Request failed: ${res.status}`);
  }
  return json.data;
}

export function useImportFlow() {
  const [file, setFile] = useState<File | null>(null);
  const [job, setJob] = useState<ImportJob | null>(null);
  const [jobLogs, setJobLogs] = useState<Array<{ rowNumber: number; status: string; errorReason?: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state = useMemo(() => {
    if (isUploading) return "uploading" as const;
    if (!job) return "idle" as const;
    if (job.status === "processing" || job.status === "queued") return "processing" as const;
    if (job.status === "completed") return "complete" as const;
    return "error" as const;
  }, [isUploading, job]);

  const progress = job?.progress ?? 0;

  const startImport = useCallback(async () => {
    if (!file) {
      setError("Please select a CSV or XLSX file before starting import.");
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await requestJson<{ jobId: string }>("/api/import/jobs", {
        method: "POST",
        body: form,
      });
      const nextJob = await requestJson<ImportJob>(`/api/import/jobs/${result.jobId}`);
      setJob(nextJob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start import");
    } finally {
      setIsUploading(false);
    }
  }, [file]);

  const downloadTemplate = useCallback(async () => {
    const response = await fetch("/api/import/template");
    if (!response.ok) {
      setError("Failed to download template");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "rivo-leads-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    if (!job?.id) return;

    const timer = setInterval(async () => {
      try {
        const nextJob = await requestJson<ImportJob>(`/api/import/jobs/${job.id}`);
        setJob(nextJob);

        if (nextJob.status === "completed" || nextJob.status === "failed") {
          const logs = await requestJson<Array<{ rowNumber: number; status: string; errorReason?: string }>>(
            `/api/import/jobs/${job.id}/logs`
          );
          setJobLogs(logs);
          clearInterval(timer);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch import status");
        clearInterval(timer);
      }
    }, 1200);

    return () => clearInterval(timer);
  }, [job?.id]);

  const reset = useCallback(() => {
    setFile(null);
    setJob(null);
    setJobLogs([]);
    setError(null);
  }, []);

  return {
    file,
    setFile,
    state,
    progress,
    job,
    jobLogs,
    error,
    startImport,
    reset,
    downloadTemplate,
  };
}

