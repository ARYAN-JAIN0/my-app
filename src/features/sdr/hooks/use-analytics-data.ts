"use client";

import { useCallback, useEffect, useState } from "react";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  reason?: string;
  message?: string;
}

async function requestJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || json.reason || `Request failed: ${res.status}`);
  }
  return json.data;
}

export function useAnalyticsData(search: string, status: "all" | "converted" | "responded" | "contacted") {
  const [summary, setSummary] = useState<{ totalLeads: number; contacted: number; contactRate: number; conversionRate: number; approvalRate: number } | null>(null);
  const [stream, setStream] = useState<Array<{ id: string; leadName: string; company: string; status: "converted" | "responded" | "contacted"; signalScore: number; timestamp: string }>>([]);
  const [funnel, setFunnel] = useState<{ processed: number; contacted: number; converted: number } | null>(null);
  const [approvals, setApprovals] = useState<{ total: number; approved: number; rejected: number } | null>(null);
  const [insights, setInsights] = useState<{ highPrecisionVectors: string[]; frictionAnalysis: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryData, streamData, funnelData, approvalData, insightData] = await Promise.all([
        requestJson<{ totalLeads: number; contacted: number; contactRate: number; conversionRate: number; approvalRate: number }>("/api/analytics/summary"),
        requestJson<Array<{ id: string; leadName: string; company: string; status: "converted" | "responded" | "contacted"; signalScore: number; timestamp: string }>>(
          `/api/analytics/stream?search=${encodeURIComponent(search)}&status=${status}`
        ),
        requestJson<{ processed: number; contacted: number; converted: number }>("/api/analytics/funnel"),
        requestJson<{ total: number; approved: number; rejected: number }>("/api/analytics/approvals"),
        requestJson<{ highPrecisionVectors: string[]; frictionAnalysis: string[] }>("/api/analytics/insights"),
      ]);

      setSummary(summaryData);
      setStream(streamData);
      setFunnel(funnelData);
      setApprovals(approvalData);
      setInsights(insightData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    summary,
    stream,
    funnel,
    approvals,
    insights,
    isLoading,
    error,
    refresh,
  };
}
