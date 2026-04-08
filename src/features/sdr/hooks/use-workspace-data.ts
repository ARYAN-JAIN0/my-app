"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WorkspaceKpiItem, WorkspaceLeadItem } from "../types/sdr-ui.types";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  reason?: string;
  message?: string;
}

interface WorkspacePayload {
  kpis: WorkspaceKpiItem[];
  leads: WorkspaceLeadItem[];
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || json.reason || `Request failed: ${res.status}`);
  }
  return json.data;
}

export function useWorkspaceData() {
  const [kpis, setKpis] = useState<WorkspaceKpiItem[]>([]);
  const [leads, setLeads] = useState<WorkspaceLeadItem[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [queueFilter, setQueueFilter] = useState<"priority" | "score" | "needs-action">("priority");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? leads[0] ?? null,
    [leads, selectedLeadId]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await requestJson<WorkspacePayload>(
        `/api/sdr/workspace?filter=${encodeURIComponent(queueFilter)}&search=${encodeURIComponent(search)}`
      );
      setKpis(payload.kpis);
      setLeads(payload.leads);
      setSelectedLeadId((current) => current || payload.leads[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
    } finally {
      setIsLoading(false);
    }
  }, [queueFilter, search]);

  const saveDraft = useCallback(async (subject: string, body: string) => {
    if (!selectedLead) return;
    setIsSaving(true);
    setError(null);
    try {
      await requestJson(`/api/sdr/leads/${selectedLead.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", subject, body }),
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [refresh, selectedLead]);

  const regenerateDraft = useCallback(async () => {
    if (!selectedLead) return;
    setIsSaving(true);
    setError(null);
    try {
      await requestJson(`/api/sdr/leads/${selectedLead.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate" }),
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate draft");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [refresh, selectedLead]);

  const rejectDraft = useCallback(async () => {
    if (!selectedLead) return;
    setIsSaving(true);
    setError(null);
    try {
      await requestJson(`/api/sdr/leads/${selectedLead.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject draft");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [refresh, selectedLead]);

  const approveDraft = useCallback(async () => {
    if (!selectedLead) return;
    setIsSaving(true);
    setError(null);
    try {
      await requestJson(`/api/sdr/leads/${selectedLead.id}/approve`, {
        method: "POST",
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve draft");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [refresh, selectedLead]);

  const sendApproved = useCallback(async () => {
    if (!selectedLead) return;
    setIsSaving(true);
    setError(null);
    try {
      await requestJson(`/api/sdr/leads/${selectedLead.id}/send`, {
        method: "POST",
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send approved draft");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [refresh, selectedLead]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    kpis,
    leads,
    selectedLead,
    selectedLeadId,
    setSelectedLeadId,
    queueFilter,
    setQueueFilter,
    search,
    setSearch,
    isLoading,
    isSaving,
    error,
    refresh,
    saveDraft,
    regenerateDraft,
    rejectDraft,
    approveDraft,
    sendApproved,
  };
}
