"use client";

import { useEffect, useMemo, useState } from "react";

interface ApiEnvelope<T> { success: boolean; data?: T; reason?: string; message?: string }

type UserPayload = {
  id: string;
  email: string;
  name: string;
  role: string;
  integrations: { gmail: { connected: boolean; email: string | null; connectedAt: string | null } };
};

type AiStatusPayload = {
  providers: Record<string, { configured: boolean; reachable: boolean; model: string | null }>;
  activeOrder: string[];
};

type AiSetting = {
  provider: "local" | "openrouter" | "groq";
  enabled: boolean;
  baseUrl?: string | null;
  apiKey?: string | null;
  model?: string | null;
  fallbackProvider?: string | null;
  fallbackModel?: string | null;
  mode?: string | null;
  temperature?: number | null;
  timeoutMs?: number | null;
  retries?: number | null;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !json.success || !json.data) throw new Error(json.message || json.reason || `Request failed: ${res.status}`);
  return json.data;
}

const blankSetting = (provider: AiSetting["provider"]): AiSetting => ({ provider, enabled: provider === "local", baseUrl: "", apiKey: "", model: "", fallbackProvider: "", fallbackModel: "", mode: "local-first", temperature: 0.3, timeoutMs: 30000, retries: 1 });

export default function SettingsPage() {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatusPayload | null>(null);
  const [settings, setSettings] = useState<Record<AiSetting["provider"], AiSetting>>({ local: blankSetting("local"), openrouter: blankSetting("openrouter"), groq: blankSetting("groq") });
  const [selectedProvider, setSelectedProvider] = useState<AiSetting["provider"]>("local");
  const [sampleOutput, setSampleOutput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const [userData, aiData, aiSettings] = await Promise.all([
          requestJson<UserPayload>("/api/user"),
          requestJson<AiStatusPayload>("/api/ai/status"),
          requestJson<AiSetting[]>("/api/settings/ai"),
        ]);
        setUser(userData);
        setAiStatus(aiData);
        const merged = { local: blankSetting("local"), openrouter: blankSetting("openrouter"), groq: blankSetting("groq") };
        for (const setting of aiSettings) merged[setting.provider] = { ...merged[setting.provider], ...setting };
        setSettings(merged);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings");
      }
    };
    void load();
  }, []);

  const currentSetting = useMemo(() => settings[selectedProvider], [settings, selectedProvider]);

  const update = (patch: Partial<AiSetting>) => setSettings((current) => ({ ...current, [selectedProvider]: { ...current[selectedProvider], ...patch } }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      <h1 className="font-headline text-5xl font-bold display-tight text-white">Settings</h1>
      {error && <div className="rounded-md border border-tertiary/40 bg-tertiary/10 px-3 py-2 text-sm text-tertiary">{error}</div>}
      {status && <div className="rounded-md border border-secondary/40 bg-secondary/10 px-3 py-2 text-sm text-secondary">{status}</div>}

      <section className="rounded-xl bg-surface-container p-5 space-y-3">
        <h2 className="text-lg font-semibold">User</h2>
        <p className="text-sm text-muted-foreground">Name: {user?.name || "-"}</p>
        <p className="text-sm text-muted-foreground">Email: {user?.email || "-"}</p>
        <p className="text-sm text-muted-foreground">Role: {user?.role || "-"}</p>
      </section>

      <section className="rounded-xl bg-surface-container p-5 space-y-3">
        <h2 className="text-lg font-semibold">Gmail Integration</h2>
        <p className="text-sm text-muted-foreground">Connected: {user?.integrations.gmail.connected ? "Yes" : "No"}</p>
        <p className="text-sm text-muted-foreground">Account: {user?.integrations.gmail.email || "-"}</p>
        <p className="text-sm text-muted-foreground">Connected At: {user?.integrations.gmail.connectedAt || "-"}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-block rounded bg-primary px-3 py-2 text-primary-foreground"
            onClick={async () => {
              try {
                const result = await requestJson<{ url: string }>("/api/integrations/gmail/auth-url");
                window.location.href = result.url;
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to start Gmail OAuth");
              }
            }}
          >
            Connect Gmail
          </button>
          <button
            type="button"
            className="inline-block rounded border px-3 py-2"
            onClick={async () => {
              try {
                const result = await requestJson<{ synced: number }>("/api/integrations/gmail/sync", { method: "POST" });
                setStatus(`Synced ${result.synced} replies.`);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to sync Gmail replies");
              }
            }}
          >
            Sync Replies
          </button>
        </div>
      </section>

      <section className="rounded-xl bg-surface-container p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {(["local", "openrouter", "groq"] as const).map((provider) => (
            <button key={provider} className={`rounded px-3 py-2 text-sm ${selectedProvider === provider ? "bg-primary text-primary-foreground" : "border"}`} onClick={() => setSelectedProvider(provider)}>{provider}</button>
          ))}
        </div>
        <h2 className="text-lg font-semibold">AI / Model Settings</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Enabled</span>
            <select className="w-full rounded border bg-background px-3 py-2" value={currentSetting.enabled ? "true" : "false"} onChange={(e) => update({ enabled: e.target.value === "true" })}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Mode</span>
            <input className="w-full rounded border bg-background px-3 py-2" value={currentSetting.mode || ""} onChange={(e) => update({ mode: e.target.value })} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Base URL</span>
            <input className="w-full rounded border bg-background px-3 py-2" value={currentSetting.baseUrl || ""} onChange={(e) => update({ baseUrl: e.target.value })} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">API Key</span>
            <input className="w-full rounded border bg-background px-3 py-2" value={currentSetting.apiKey || ""} onChange={(e) => update({ apiKey: e.target.value })} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Active Model</span>
            <input className="w-full rounded border bg-background px-3 py-2" value={currentSetting.model || ""} onChange={(e) => update({ model: e.target.value })} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Fallback Provider</span>
            <input className="w-full rounded border bg-background px-3 py-2" value={currentSetting.fallbackProvider || ""} onChange={(e) => update({ fallbackProvider: e.target.value })} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Fallback Model</span>
            <input className="w-full rounded border bg-background px-3 py-2" value={currentSetting.fallbackModel || ""} onChange={(e) => update({ fallbackModel: e.target.value })} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Temperature</span>
            <input type="number" step="0.1" className="w-full rounded border bg-background px-3 py-2" value={currentSetting.temperature ?? 0.3} onChange={(e) => update({ temperature: Number(e.target.value) })} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Timeout (ms)</span>
            <input type="number" className="w-full rounded border bg-background px-3 py-2" value={currentSetting.timeoutMs ?? 30000} onChange={(e) => update({ timeoutMs: Number(e.target.value) })} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Retries</span>
            <input type="number" className="w-full rounded border bg-background px-3 py-2" value={currentSetting.retries ?? 1} onChange={(e) => update({ retries: Number(e.target.value) })} />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50" disabled={isSaving} onClick={async () => {
            setIsSaving(true);
            setError(null);
            setStatus('');
            try {
              await requestJson('/api/settings/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentSetting) });
              setStatus(`${selectedProvider} settings saved.`);
              const aiData = await requestJson<AiStatusPayload>('/api/ai/status');
              setAiStatus(aiData);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to save settings');
            } finally {
              setIsSaving(false);
            }
          }}>{isSaving ? 'Saving...' : 'Save Settings'}</button>
          <button className="rounded border px-3 py-2" onClick={async () => {
            setError(null);
            setStatus('');
            try {
              const result = await requestJson<{ latencyMs: number; content: string; model: string; provider: string }>('/api/settings/ai/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: selectedProvider, prompt: 'Generate a one-line readiness check for Rivo.' }) });
              setSampleOutput(`${result.provider}/${result.model} in ${result.latencyMs}ms`);
              setStatus('AI connection test passed.');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'AI connection test failed');
            }
          }}>Test Connection</button>
          <button className="rounded border px-3 py-2" onClick={async () => {
            setError(null);
            setStatus('');
            try {
              const result = await requestJson<{ latencyMs: number; content: string; model: string; provider: string }>('/api/settings/ai/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: selectedProvider, prompt: 'Write one short outbound line to a VP Sales at a SaaS company.' }) });
              setSampleOutput(result.content);
              setStatus('Sample generation completed.');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Generation test failed');
            }
          }}>Run Sample Generation</button>
        </div>
        <div className="space-y-2 rounded border border-outline-variant/20 px-3 py-2 text-sm">
          <p className="font-medium">Provider health</p>
          <p className="text-muted-foreground">Configured: {aiStatus?.providers[selectedProvider]?.configured ? 'Yes' : 'No'}</p>
          <p className="text-muted-foreground">Reachable: {aiStatus?.providers[selectedProvider]?.reachable ? 'Yes' : 'No'}</p>
          <p className="text-muted-foreground">Model: {aiStatus?.providers[selectedProvider]?.model || '-'}</p>
          <p className="text-muted-foreground">Active order: {(aiStatus?.activeOrder || []).join(' -> ') || '-'}</p>
          <p className="text-muted-foreground">Last result: {sampleOutput || '-'}</p>
        </div>
      </section>
    </div>
  );
}

