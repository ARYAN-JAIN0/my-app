"use client";

import { useEffect, useState } from "react";

interface ApiEnvelope<T> { success: boolean; data?: T; reason?: string; message?: string }

type StatusPayload = {
  latest: { featureStatuses: Array<{ id: string; featureKey: string; description: string; status: string; route?: string | null; backendEndpoint?: string | null; updatedAt: string; lastCheckedAt?: string | null; lastSuccessAt?: string | null }>; recentChecks: Array<{ id: string; checkKey: string; status: string; message?: string | null; latencyMs?: number | null; createdAt: string }> };
  run: { checkedAt: string; features: Array<{ key: string; description: string; status: string; latencyMs?: number; message?: string }> };
};

async function loadStatus(): Promise<StatusPayload> {
  const res = await fetch("/api/system/status");
  const json = (await res.json()) as ApiEnvelope<StatusPayload>;
  if (!res.ok || !json.success || !json.data) throw new Error(json.message || json.reason || "Failed to load status");
  return json.data;
}

export default function StatusPage() {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const refresh = async (force = false) => {
    setError(null);
    setIsRunning(force);
    try {
      const res = force ? await fetch("/api/system/status", { method: "POST" }) : await fetch("/api/system/status");
      const json = (await res.json()) as ApiEnvelope<StatusPayload | StatusPayload["run"]>;
      if (!res.ok || !json.success || !json.data) throw new Error(json.message || json.reason || "Failed to load status");
      if (force) {
        const full = await loadStatus();
        setData(full);
      } else {
        setData(json.data as StatusPayload);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status");
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-headline text-5xl font-bold display-tight text-white">System Status</h1>
          <p className="text-muted-foreground">Live feature and dependency checks for Rivo.</p>
        </div>
        <button className="rounded bg-primary px-3 py-2 text-primary-foreground" onClick={() => void refresh(true)} disabled={isRunning}>{isRunning ? "Running checks..." : "Run checks"}</button>
      </div>
      {error && <div className="rounded border border-tertiary/30 bg-tertiary/10 p-3 text-sm text-tertiary">{error}</div>}
      <div className="grid gap-4 md:grid-cols-3">
        {(data?.latest.featureStatuses || []).map((item) => (
          <div key={item.id} className="rounded-xl bg-surface-container p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em]">{item.featureKey}</h2>
              <span className={`rounded px-2 py-1 text-xs ${item.status === "passing" ? "bg-secondary/20 text-secondary" : item.status === "warning" ? "bg-yellow-500/20 text-yellow-300" : "bg-tertiary/20 text-tertiary"}`}>{item.status}</span>
            </div>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            <p className="text-xs text-muted-foreground">Route: {item.route || "-"}</p>
            <p className="text-xs text-muted-foreground">Endpoint: {item.backendEndpoint || "-"}</p>
            <p className="text-xs text-muted-foreground">Last checked: {item.lastCheckedAt ? new Date(item.lastCheckedAt).toLocaleString() : "-"}</p>
          </div>
        ))}
      </div>
      <section className="rounded-xl bg-surface-container p-4">
        <h2 className="mb-3 text-lg font-semibold">Recent checks</h2>
        <div className="space-y-2">
          {(data?.latest.recentChecks || []).map((check) => (
            <div key={check.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-outline-variant/10 px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{check.checkKey}</p>
                <p className="text-muted-foreground">{check.message || "OK"}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{check.status}</p>
                <p>{check.latencyMs ?? 0} ms</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

