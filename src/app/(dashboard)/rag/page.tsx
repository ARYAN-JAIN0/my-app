"use client";

import { useEffect, useState } from "react";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  reason?: string;
  message?: string;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || json.reason || `Request failed: ${res.status}`);
  }
  return json.data;
}

export default function RagPage() {
  const [category, setCategory] = useState("business_context");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [query, setQuery] = useState("");
  const [context, setContext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const runQuery = async () => {
    setError(null);
    try {
      const result = await requestJson<{ context: string }>(`/api/rag?query=${encodeURIComponent(query)}`);
      setContext(result.context);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    }
  };

  useEffect(() => {
    if (!query) return;
    const timer = setTimeout(() => {
      runQuery();
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">RAG Dashboard</h1>
        <p className="text-muted-foreground">Ingest business rules and retrieve contextual guidance.</p>
      </div>

      {error && <div className="rounded-md border border-tertiary/40 bg-tertiary/10 px-3 py-2 text-sm text-tertiary">{error}</div>}
      {status && <div className="rounded-md border border-secondary/40 bg-secondary/10 px-3 py-2 text-sm text-secondary">{status}</div>}

      <section className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="text-lg font-semibold">Knowledge Ingestion</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input value={category} onChange={(e) => setCategory(e.target.value)} className="rounded border px-3 py-2" placeholder="category" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border px-3 py-2" placeholder="title" />
          <button
            type="button"
            className="rounded bg-primary px-3 py-2 text-primary-foreground"
            onClick={async () => {
              setError(null);
              setStatus("");
              try {
                await requestJson("/api/rag", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ category, title, content }),
                });
                setStatus("Knowledge rule ingested.");
                setContent("");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Ingestion failed");
              }
            }}
          >
            Ingest
          </button>
        </div>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full min-h-[120px] rounded border px-3 py-2" placeholder="rule content" />
      </section>

      <section className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="text-lg font-semibold">Context Retrieval</h2>
        <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded border px-3 py-2" placeholder="Ask for context..." />
        <pre className="overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap">{context || "No context yet."}</pre>
      </section>
    </div>
  );
}
