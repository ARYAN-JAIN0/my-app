"use client";

import { useEffect, useState } from "react";

interface ApiEnvelope<T> { success: boolean; data?: T; reason?: string; message?: string }
const tables = ["leads","messages","threads","approvals","importJobs","importRows","jobRuns","activityLogs","healthChecks","stressTestRuns","knowledgeRules","knowledgeChunks","analyticsEvents"] as const;
type TableName = typeof tables[number];

export default function DataPage() {
  const [table, setTable] = useState<TableName>('leads');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<unknown[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/data-explorer?table=${encodeURIComponent(table)}&search=${encodeURIComponent(search)}`);
        const json = (await res.json()) as ApiEnvelope<{ table: string; rows: unknown[] }>;
        if (!res.ok || !json.success || !json.data) throw new Error(json.message || json.reason || 'Failed to load data');
        setRows(json.data.rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      }
    };
    const timer = setTimeout(() => void load(), 200);
    return () => clearTimeout(timer);
  }, [table, search]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="font-headline text-5xl font-bold display-tight text-white">Data Explorer</h1>
          <p className="text-muted-foreground">Browse the truth layer behind the app.</p>
        </div>
        <select className="rounded border bg-surface-container px-3 py-2" value={table} onChange={(e) => setTable(e.target.value as TableName)}>
          {tables.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <input className="rounded border bg-surface-container px-3 py-2" placeholder="Search leads only" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {error && <div className="rounded border border-tertiary/30 bg-tertiary/10 p-3 text-sm text-tertiary">{error}</div>}
      <pre className="overflow-auto rounded-xl bg-surface-container p-4 text-xs">{JSON.stringify(rows, null, 2)}</pre>
    </div>
  );
}

