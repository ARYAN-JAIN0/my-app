"use client";

import { useEffect, useState } from "react";

interface ApiEnvelope<T> { success: boolean; data?: T; reason?: string; message?: string }

type StressRun = { id: string; name: string; status: string; leadCount: number; avgLatencyMs?: number | null; p95LatencyMs?: number | null; successCount: number; failureCount: number; queueDepth?: number | null; slowestEndpoint?: string | null; createdAt: string; metrics: Array<{ id: string; name: string; value: number; unit?: string | null }> };

export default function QaPage() {
  const [runs, setRuns] = useState<StressRun[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const refresh = async () => {
    const res = await fetch('/api/stress/runs');
    const json = (await res.json()) as ApiEnvelope<StressRun[]>;
    if (!res.ok || !json.success || !json.data) throw new Error(json.message || json.reason || 'Failed to load runs');
    setRuns(json.data);
  };

  useEffect(() => { void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load runs')); }, []);

  const runTest = async (leadCount: 10 | 50 | 100 | 250) => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/stress/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadCount, simulateApprovals: true, simulateReplies: leadCount <= 50 }) });
      const json = (await res.json()) as ApiEnvelope<StressRun>;
      if (!res.ok || !json.success || !json.data) throw new Error(json.message || json.reason || 'Failed to run stress test');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run stress test');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-headline text-5xl font-bold display-tight text-white">Stress & QA</h1>
          <p className="text-muted-foreground">Seed and process load scenarios directly from the app.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[10,50,100,250].map((count) => (
            <button key={count} className="rounded bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50" disabled={isRunning} onClick={() => void runTest(count as 10 | 50 | 100 | 250)}>{isRunning ? 'Running...' : `Run ${count}`}</button>
          ))}
        </div>
      </div>
      {error && <div className="rounded border border-tertiary/30 bg-tertiary/10 p-3 text-sm text-tertiary">{error}</div>}
      <div className="grid gap-4">
        {runs.map((run) => (
          <div key={run.id} className="rounded-xl bg-surface-container p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{run.name}</h2>
              <span>{run.status}</span>
            </div>
            <p className="text-sm text-muted-foreground">Processed {run.leadCount} leads • success {run.successCount} • failure {run.failureCount}</p>
            <p className="text-sm text-muted-foreground">Avg {Math.round(run.avgLatencyMs || 0)} ms • p95 {Math.round(run.p95LatencyMs || 0)} ms • queue depth {run.queueDepth || 0}</p>
            <p className="text-sm text-muted-foreground">Slowest path: {run.slowestEndpoint || '-'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

