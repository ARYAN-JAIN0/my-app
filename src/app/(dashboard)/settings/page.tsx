"use client";

import { useEffect, useState } from "react";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  reason?: string;
  message?: string;
}

type UserPayload = {
  id: string;
  email: string;
  name: string;
  role: string;
  integrations: {
    gmail: {
      connected: boolean;
      email: string | null;
      connectedAt: string | null;
    };
  };
};

type AiStatusPayload = {
  providers: Record<
    string,
    {
      configured: boolean;
      reachable: boolean;
      model: string | null;
    }
  >;
  activeOrder: string[];
};

async function requestJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || json.reason || `Request failed: ${res.status}`);
  }
  return json.data;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const [userData, aiData] = await Promise.all([
          requestJson<UserPayload>("/api/user"),
          requestJson<AiStatusPayload>("/api/ai/status"),
        ]);
        setUser(userData);
        setAiStatus(aiData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings");
      }
    };
    void load();
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <h1 className="font-headline text-5xl font-bold display-tight text-white">Settings</h1>
      {error && <div className="rounded-md border border-tertiary/40 bg-tertiary/10 px-3 py-2 text-sm text-tertiary">{error}</div>}

      <section className="rounded-xl bg-surface-container p-5 space-y-3">
        <h2 className="text-lg font-semibold">User</h2>
        <p className="text-sm text-muted-foreground">Name: {user?.name || "-"}</p>
        <p className="text-sm text-muted-foreground">Email: {user?.email || "-"}</p>
        <p className="text-sm text-muted-foreground">Role: {user?.role || "-"}</p>
      </section>

      <section className="rounded-xl bg-surface-container p-5 space-y-3">
        <h2 className="text-lg font-semibold">Gmail Integration</h2>
        <p className="text-sm text-muted-foreground">
          Connected: {user?.integrations.gmail.connected ? "Yes" : "No"}
        </p>
        <p className="text-sm text-muted-foreground">Account: {user?.integrations.gmail.email || "-"}</p>
        <p className="text-sm text-muted-foreground">Connected At: {user?.integrations.gmail.connectedAt || "-"}</p>
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
      </section>

      <section className="rounded-xl bg-surface-container p-5 space-y-3">
        <h2 className="text-lg font-semibold">AI Providers</h2>
        <div className="space-y-2">
          {Object.entries(aiStatus?.providers || {}).map(([name, data]) => (
            <div key={name} className="rounded border border-outline-variant/20 px-3 py-2 text-sm">
              <p className="font-medium">{name}</p>
              <p className="text-muted-foreground">Configured: {data.configured ? "Yes" : "No"}</p>
              <p className="text-muted-foreground">Reachable: {data.reachable ? "Yes" : "No"}</p>
              <p className="text-muted-foreground">Model: {data.model || "-"}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
