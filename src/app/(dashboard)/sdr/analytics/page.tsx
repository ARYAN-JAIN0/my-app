"use client";

import { useMemo, useState } from "react";
import { AnalyticsTable, FunnelCard, GlassPanel, KpiCard } from "@/features/sdr/components/sdr-primitives";
import { useAnalyticsData } from "@/features/sdr/hooks/use-analytics-data";

export default function AnalyticsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "converted" | "responded" | "contacted">("all");
  const { summary, stream, funnel, approvals, insights, isLoading, error, refresh } = useAnalyticsData(search, filter);

  const analyticsKpis = useMemo(
    () => [
      {
        id: "total-leads",
        label: "Total Leads Processed",
        value: String(summary?.totalLeads ?? 0),
        hint: "DB computed",
        accent: "primary" as const,
      },
      {
        id: "contacted",
        label: "Total Leads Contacted",
        value: String(summary?.contacted ?? 0),
        hint: `${(summary?.contactRate ?? 0).toFixed(1)}% rate`,
        accent: "secondary" as const,
      },
      {
        id: "conversion-rate",
        label: "Conversion Rate",
        value: `${(summary?.conversionRate ?? 0).toFixed(1)}%`,
        hint: "Replies/Total",
        accent: "neutral" as const,
      },
      {
        id: "approval-rate",
        label: "Approval Rate",
        value: `${(summary?.approvalRate ?? 0).toFixed(1)}%`,
        hint: "From approvals",
        accent: "tertiary" as const,
      },
    ],
    [summary]
  );

  return (
    <div className="space-y-8 pb-8">
      <section>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-headline text-5xl font-bold display-tight text-white">Lead Processing Overview</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Real-time performance telemetry for AI-driven SDR workflows.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-outline-variant/25 px-4 py-2 label-meta text-foreground/70"
              onClick={() => window.open("/api/analytics/export", "_blank")}
            >
              Export Report
            </button>
            <button
              type="button"
              className="btn-primary-lithic rounded-lg px-4 py-2 label-meta"
              onClick={refresh}
            >
              Refresh Data
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {analyticsKpis.map((item) => (
            <KpiCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {isLoading && <p className="text-sm text-muted-foreground">Loading analytics...</p>}
      {error && <p className="text-sm text-tertiary">{error}</p>}

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <AnalyticsTable
            rows={stream}
            search={search}
            filter={filter}
            onSearchChange={setSearch}
            onFilterChange={setFilter}
          />
        </div>
        <div className="xl:col-span-4">
          <FunnelCard metrics={funnel || { processed: 0, contacted: 0, converted: 0 }} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-headline text-5xl font-bold display-tight text-white">Approval Analytics</h2>
        <div className="grid gap-6 xl:grid-cols-12">
          <GlassPanel className="xl:col-span-4 space-y-5 bg-surface-container">
            <h3 className="font-headline text-3xl font-bold display-tight text-white">System Approval Ratio</h3>
            <div className="flex h-56 items-end justify-between gap-4">
              {[
                ["Total", String(approvals?.total ?? 0), "h-full", "bg-primary/35"],
                ["Approved", String(approvals?.approved ?? 0), "h-[72%]", "btn-primary-lithic"],
                ["Rejected", String(approvals?.rejected ?? 0), "h-[27%]", "bg-tertiary"],
              ].map(([label, value, height, tone]) => (
                <div key={label} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-white">{value}</span>
                  <div className={`w-full rounded-t-sm ${height} ${tone}`} />
                  <span className="label-meta text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </GlassPanel>

          <article className="xl:col-span-4 rounded-xl bg-surface-container p-6 shadow-[inset_2px_0_0_0_#34b5fa]">
            <h3 className="font-headline text-3xl font-bold uppercase tracking-[0.03em] text-secondary">
              High Precision Vectors
            </h3>
            <ul className="mt-4 space-y-4 text-lg text-muted-foreground">
              {(insights?.highPrecisionVectors ?? []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="xl:col-span-4 rounded-xl bg-surface-container p-6 shadow-[inset_2px_0_0_0_#ff6f7e]">
            <h3 className="font-headline text-3xl font-bold uppercase tracking-[0.03em] text-tertiary">
              Friction Analysis
            </h3>
            <ul className="mt-4 space-y-4 text-lg text-muted-foreground">
              {(insights?.frictionAnalysis ?? []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>

        {funnel && (
          <p className="text-xs text-muted-foreground">
            Funnel: processed {funnel.processed}, contacted {funnel.contacted}, converted {funnel.converted}
          </p>
        )}
      </section>
    </div>
  );
}
