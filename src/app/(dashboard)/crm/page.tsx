"use client";

import { useEffect, useMemo } from "react";
import { useDeals } from "@/features/crm/hooks/use-deals";

export default function CrmPage() {
  const { deals, isLoading, error, fetchDeals, updateDealStage } = useDeals();

  useEffect(() => { void fetchDeals(); }, [fetchDeals]);

  const summary = useMemo(() => ({
    total: deals.length,
    active: deals.filter((deal) => deal.status === "active").length,
    won: deals.filter((deal) => deal.status === "won").length,
    value: deals.reduce((sum, deal) => sum + deal.value, 0),
  }), [deals]);

  return (
    <div className="container mx-auto space-y-6 py-8 px-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">CRM Dashboard</h1>
        <p className="text-muted-foreground">Lead-derived deal pipeline backed by the real SDR workspace data.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-surface-container p-4">Total deals: {summary.total}</div>
        <div className="rounded-xl bg-surface-container p-4">Active: {summary.active}</div>
        <div className="rounded-xl bg-surface-container p-4">Won: {summary.won}</div>
        <div className="rounded-xl bg-surface-container p-4">Pipeline value: ${summary.value.toLocaleString()}</div>
      </div>
      {error && <div className="rounded border border-tertiary/30 bg-tertiary/10 p-3 text-sm text-tertiary">{error}</div>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading deals...</p>}
      <div className="space-y-3">
        {deals.map((deal) => (
          <div key={deal.id} className="rounded-xl bg-surface-container p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{deal.name}</p>
                <p className="text-sm text-muted-foreground">${deal.value.toLocaleString()}</p>
              </div>
              <select className="rounded border bg-background px-3 py-2 text-sm" value={deal.stage} onChange={(e) => void updateDealStage(deal.id, e.target.value as never)}>
                {['prospect','qualification','proposal','negotiation','closed-won','closed-lost'].map((stage) => <option key={stage} value={stage}>{stage}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

