"use client";

import { useCallback, useEffect, useState } from "react";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  reason?: string;
  message?: string;
}

type RagDocument = {
  id: string;
  category: string;
  title: string;
  active: boolean;
  chunkCount: number;
  updatedAt: string;
  createdAt: string;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || json.reason || `Request failed: ${res.status}`);
  }
  return json.data;
}

export default function RagPage() {
  const [query, setQuery] = useState("");
  const [context, setContext] = useState("");
  const [category, setCategory] = useState("knowledge");
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  const refreshDocuments = useCallback(async () => {
    const docs = await requestJson<RagDocument[]>("/api/rag/documents");
    setDocuments(docs);
  }, []);

  const runQuery = useCallback(async () => {
    if (!query.trim()) {
      setContext("");
      return;
    }
    const result = await requestJson<{ context: string }>(`/api/rag?query=${encodeURIComponent(query)}`);
    setContext(result.context);
  }, [query]);

  useEffect(() => {
    refreshDocuments().catch((err) => setError(err instanceof Error ? err.message : "Failed to load documents"));
  }, [refreshDocuments]);

  useEffect(() => {
    const timer = setTimeout(() => {
      runQuery().catch((err) => setError(err instanceof Error ? err.message : "Query failed"));
    }, 250);
    return () => clearTimeout(timer);
  }, [runQuery]);

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RAG Dashboard</h1>
          <p className="text-muted-foreground">Upload documents, manage knowledge base, reindex chunks, and query contextual retrieval.</p>
        </div>
        <button
          type="button"
          className="rounded bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
          disabled={isReindexing}
          onClick={async () => {
            setError(null);
            setStatus("");
            setIsReindexing(true);
            try {
              const result = await requestJson<{ documents: number; chunks: number }>("/api/rag/reindex", { method: "POST" });
              setStatus(`Reindex complete: ${result.documents} documents, ${result.chunks} chunks.`);
              await refreshDocuments();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Reindex failed");
            } finally {
              setIsReindexing(false);
            }
          }}
        >
          {isReindexing ? "Reindexing..." : "Reindex Knowledge Base"}
        </button>
      </div>

      {error && <div className="rounded-md border border-tertiary/40 bg-tertiary/10 px-3 py-2 text-sm text-tertiary">{error}</div>}
      {status && <div className="rounded-md border border-secondary/40 bg-secondary/10 px-3 py-2 text-sm text-secondary">{status}</div>}

      <section className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="text-lg font-semibold">Upload Document</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded border px-3 py-2"
            placeholder="category"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded border px-3 py-2"
            placeholder="document title"
          />
          <input
            type="file"
            accept=".txt,.md,.csv,.json,.pdf"
            className="rounded border px-3 py-2"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          />
        </div>
        <button
          type="button"
          className="rounded bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
          disabled={!selectedFile || isUploading}
          onClick={async () => {
            if (!selectedFile) return;
            setError(null);
            setStatus("");
            setIsUploading(true);
            try {
              const form = new FormData();
              form.append("file", selectedFile);
              form.append("category", category);
              if (title.trim()) form.append("title", title.trim());
              await requestJson("/api/rag/documents", { method: "POST", body: form });
              setStatus(`Uploaded ${selectedFile.name}.`);
              setSelectedFile(null);
              setTitle("");
              await refreshDocuments();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Upload failed");
            } finally {
              setIsUploading(false);
            }
          }}
        >
          {isUploading ? "Uploading..." : "Upload & Ingest"}
        </button>
      </section>

      <section className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="text-lg font-semibold">Knowledge Documents</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Chunks</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Updated</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-t">
                  <td className="px-3 py-2">{doc.title}</td>
                  <td className="px-3 py-2">{doc.category}</td>
                  <td className="px-3 py-2">{doc.chunkCount}</td>
                  <td className="px-3 py-2">{doc.active ? "indexed" : "inactive"}</td>
                  <td className="px-3 py-2">{new Date(doc.updatedAt).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="rounded border px-2 py-1"
                      onClick={async () => {
                        setError(null);
                        setStatus("");
                        try {
                          await requestJson(`/api/rag/documents/${doc.id}`, { method: "DELETE" });
                          setStatus(`Deleted "${doc.title}".`);
                          await refreshDocuments();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Delete failed");
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {documents.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-muted-foreground" colSpan={6}>
                    No documents yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="text-lg font-semibold">Context Retrieval</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder="Ask for context..."
        />
        <pre className="overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap">{context || "No context yet."}</pre>
      </section>
    </div>
  );
}
