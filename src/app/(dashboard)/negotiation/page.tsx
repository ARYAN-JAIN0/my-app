"use client";

import { useEffect, useState } from "react";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  reason?: string;
  message?: string;
}

type NegotiationRow = {
  id: string;
  leadName: string;
  company: string;
  stage: string;
  latestMessage: string;
  score: number;
  updatedAt: string;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || json.reason || `Request failed: ${res.status}`);
  }
  return json.data;
}

export default function NegotiationPage() {
  const [rows, setRows] = useState<NegotiationRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setError(null);
    try {
      const data = await requestJson<NegotiationRow[]>("/api/negotiation");
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load negotiations");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Negotiation Dashboard</h1>
          <p className="text-muted-foreground">Track replied leads and escalation stages.</p>
        </div>
        <button className="rounded bg-primary px-3 py-2 text-primary-foreground" onClick={refresh}>
          Refresh
        </button>
      </div>

      {error && <div className="rounded-md border border-tertiary/40 bg-tertiary/10 px-3 py-2 text-sm text-tertiary">{error}</div>}

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="px-3 py-2">Lead</th>
              <th className="px-3 py-2">Stage</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Latest Message</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-3 py-2">
                  <div className="font-medium">{row.leadName}</div>
                  <div className="text-muted-foreground">{row.company}</div>
                </td>
                <td className="px-3 py-2">{row.stage}</td>
                <td className="px-3 py-2">{row.score}</td>
                <td className="px-3 py-2 max-w-[360px] truncate">{row.latestMessage || "-"}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      className="rounded border px-2 py-1"
                      onClick={async () => {
                        await requestJson("/api/negotiation", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ leadId: row.id, lifecycle: "negotiating" }),
                        });
                        refresh();
                      }}
                    >
                      Mark Negotiating
                    </button>
                    <button
                      className="rounded border px-2 py-1"
                      onClick={async () => {
                        await requestJson("/api/negotiation", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ leadId: row.id, lifecycle: "won" }),
                        });
                        refresh();
                      }}
                    >
                      Mark Won
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-8 text-center text-muted-foreground" colSpan={5}>
                  No active negotiation rows.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
