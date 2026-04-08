"use client";

import { useEffect, useState } from "react";

interface ApiEnvelope<T> { success: boolean; data?: T; reason?: string; message?: string }

type FinancePayload = { sentMessages: number; pendingFollowups: number; approvedMessages: number; activeReplyThreads: number; reminders: Array<{ id: string; dueAt: string; status: string; leadName: string; company: string; dayOffset: number }> };

export default function FinancePage() {
  const [data, setData] = useState<FinancePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/finance');
        const json = (await res.json()) as ApiEnvelope<FinancePayload>;
        if (!res.ok || !json.success || !json.data) throw new Error(json.message || json.reason || 'Failed to load finance data');
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load finance data');
      }
    };
    void load();
  }, []);

  return (
    <div className="container mx-auto space-y-6 py-8 px-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Finance Dashboard</h1>
        <p className="text-muted-foreground">Reminder tracking and approval-linked send volume sourced from production records.</p>
      </div>
      {error && <div className="rounded border border-tertiary/30 bg-tertiary/10 p-3 text-sm text-tertiary">{error}</div>}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-surface-container p-4">Sent messages: {data?.sentMessages || 0}</div>
        <div className="rounded-xl bg-surface-container p-4">Approved messages: {data?.approvedMessages || 0}</div>
        <div className="rounded-xl bg-surface-container p-4">Pending followups: {data?.pendingFollowups || 0}</div>
        <div className="rounded-xl bg-surface-container p-4">Active reply threads: {data?.activeReplyThreads || 0}</div>
      </div>
      <section className="rounded-xl bg-surface-container p-4 space-y-3">
        <h2 className="text-lg font-semibold">Scheduled reminders</h2>
        {(data?.reminders || []).map((item) => (
          <div key={item.id} className="rounded border border-outline-variant/10 px-3 py-2 text-sm">
            <p className="font-medium">{item.leadName} • {item.company}</p>
            <p className="text-muted-foreground">Due {new Date(item.dueAt).toLocaleString()} • Day offset {item.dayOffset} • {item.status}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

