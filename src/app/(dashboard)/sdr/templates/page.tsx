"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Template = {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  active: boolean;
  updatedAt: string;
};

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

const emptyDraft = { name: "", category: "outbound", subject: "", body: "", active: true };

export default function SdrTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [draft, setDraft] = useState(emptyDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => templates.find((item) => item.id === selectedId) || templates[0] || null,
    [templates, selectedId]
  );

  const refresh = useCallback(async () => {
    setError(null);
    const data = await requestJson<Template[]>("/api/sdr/templates");
    setTemplates(data);
    setSelectedId((current) => current || data[0]?.id || "");
  }, []);

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof Error ? err.message : "Failed to load templates"));
  }, [refresh]);

  useEffect(() => {
    if (!selected) {
      setDraft(emptyDraft);
      return;
    }
    setDraft({
      name: selected.name,
      category: selected.category,
      subject: selected.subject,
      body: selected.body,
      active: selected.active,
    });
  }, [selected]);

  const saveCurrent = useCallback(async () => {
    if (!selected) return;
    setIsSaving(true);
    setError(null);
    try {
      await requestJson<Template>(`/api/sdr/templates/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  }, [draft, refresh, selected]);

  const createNew = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      const created = await requestJson<Template>("/api/sdr/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Template ${new Date().toISOString().slice(11, 19)}`,
          category: "outbound",
          subject: "New template subject",
          body: "New template body",
          active: true,
        }),
      });
      await refresh();
      setSelectedId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setIsSaving(false);
    }
  }, [refresh]);

  const removeCurrent = useCallback(async () => {
    if (!selected) return;
    setIsSaving(true);
    setError(null);
    try {
      await requestJson<{ id: string }>(`/api/sdr/templates/${selected.id}`, { method: "DELETE" });
      const removed = selected.id;
      await refresh();
      setSelectedId((current) => (current === removed ? "" : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete template");
    } finally {
      setIsSaving(false);
    }
  }, [refresh, selected]);

  return (
    <div className="mx-auto max-w-6xl py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-headline text-5xl font-bold display-tight text-white">Templates</h1>
          <p className="mt-2 text-lg text-muted-foreground">DB-backed email templates for outbound, follow-up, and reply workflows.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="rounded-lg border border-outline-variant/25 px-4 py-2 label-meta text-foreground/70" onClick={refresh}>
            Refresh
          </button>
          <button type="button" className="btn-primary-lithic rounded-lg px-4 py-2 label-meta" onClick={createNew} disabled={isSaving}>
            New Template
          </button>
        </div>
      </div>

      {error && <div className="rounded-md border border-tertiary/40 bg-tertiary/10 px-3 py-2 text-sm text-tertiary">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-4 rounded-xl bg-surface-container overflow-hidden">
          <div className="border-b border-outline-variant/20 px-4 py-3 label-meta text-muted-foreground">Available Templates</div>
          <div className="max-h-[34rem] overflow-y-auto">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedId(template.id)}
                className={`w-full text-left px-4 py-3 border-b border-outline-variant/10 ${
                  selected?.id === template.id ? "bg-surface-container-low" : "hover:bg-surface-low"
                }`}
              >
                <p className="font-semibold text-white">{template.name}</p>
                <p className="text-xs text-muted-foreground">{template.category} • {template.active ? "active" : "inactive"}</p>
              </button>
            ))}
            {templates.length === 0 && <p className="px-4 py-8 text-sm text-muted-foreground">No templates found.</p>}
          </div>
        </section>

        <section className="lg:col-span-8 rounded-xl bg-surface-container p-5 space-y-4">
          {!selected && <p className="text-sm text-muted-foreground">Select a template to edit.</p>}
          {selected && (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="label-meta text-muted-foreground">Name</span>
                  <input
                    className="w-full rounded-md bg-black px-3 py-2 text-sm text-white outline-none"
                    value={draft.name}
                    onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="label-meta text-muted-foreground">Category</span>
                  <input
                    className="w-full rounded-md bg-black px-3 py-2 text-sm text-white outline-none"
                    value={draft.category}
                    onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
                  />
                </label>
              </div>

              <label className="space-y-1 block">
                <span className="label-meta text-muted-foreground">Subject</span>
                <input
                  className="w-full rounded-md bg-black px-3 py-2 text-sm text-white outline-none"
                  value={draft.subject}
                  onChange={(event) => setDraft((prev) => ({ ...prev, subject: event.target.value }))}
                />
              </label>

              <label className="space-y-1 block">
                <span className="label-meta text-muted-foreground">Body</span>
                <textarea
                  className="min-h-[16rem] w-full rounded-md bg-black px-3 py-2 text-sm text-white outline-none"
                  value={draft.body}
                  onChange={(event) => setDraft((prev) => ({ ...prev, body: event.target.value }))}
                />
              </label>

              <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(event) => setDraft((prev) => ({ ...prev, active: event.target.checked }))}
                />
                Active template
              </label>

              <div className="flex gap-2">
                <button type="button" className="btn-primary-lithic rounded-lg px-4 py-2 label-meta" onClick={saveCurrent} disabled={isSaving}>
                  Save Template
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-tertiary/40 bg-tertiary/10 px-4 py-2 label-meta text-tertiary"
                  onClick={removeCurrent}
                  disabled={isSaving}
                >
                  Delete Template
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
