"use client";

import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
  Search,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import type {
  AnalyticsRow,
  ImportStepItem,
  WorkspaceKpiItem,
  WorkspaceLeadItem,
  WorkspaceQueueStatus,
} from "../types/sdr-ui.types";

export function KpiCard({ item }: { item: WorkspaceKpiItem }) {
  const accentStyles: Record<WorkspaceKpiItem["accent"], string> = {
    primary: "shadow-[inset_3px_0_0_0_#a3a6ff]",
    secondary: "shadow-[inset_3px_0_0_0_#34b5fa]",
    tertiary: "shadow-[inset_3px_0_0_0_#ff6f7e]",
    neutral: "shadow-[inset_3px_0_0_0_rgb(222_229_255_/_0.2)]",
  };

  const hintStyles: Record<WorkspaceKpiItem["accent"], string> = {
    primary: "text-primary",
    secondary: "text-secondary",
    tertiary: "text-tertiary",
    neutral: "text-secondary",
  };

  return (
    <article
      className={cn(
        "rounded-xl bg-surface-container p-5 transition-colors hover:bg-surface-container-low",
        accentStyles[item.accent]
      )}
    >
      <p className="label-meta text-muted-foreground">{item.label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="font-headline text-4xl font-bold display-tight text-white">{item.value}</p>
        <p className={cn("text-xs font-semibold", hintStyles[item.accent])}>{item.hint}</p>
      </div>
    </article>
  );
}

export function GlassPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("glass-panel rounded-xl p-5", className)}>{children}</section>;
}

function statusLabel(status: WorkspaceQueueStatus) {
  if (status === "needs-approval") return "Needs Approval";
  if (status === "ready") return "Auto-Send Queue";
  return "Draft";
}

function statusText(status: WorkspaceQueueStatus) {
  if (status === "needs-approval") return "text-tertiary";
  if (status === "ready") return "text-secondary";
  return "text-muted-foreground";
}

export function LeadRail({
  leads,
  selectedLeadId,
  queueFilter,
  search,
  onSearchChange,
  onFilterChange,
  onSelectLead,
}: {
  leads: WorkspaceLeadItem[];
  selectedLeadId: string;
  queueFilter: "priority" | "score" | "needs-action";
  search: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (filter: "priority" | "score" | "needs-action") => void;
  onSelectLead: (leadId: string) => void;
}) {
  const filters: Array<{ id: "priority" | "score" | "needs-action"; label: string }> = [
    { id: "priority", label: "Priority" },
    { id: "score", label: "Score" },
    { id: "needs-action", label: "Needs Action" },
  ];

  return (
    <section className="flex h-full min-h-[42rem] flex-col overflow-hidden rounded-xl bg-surface-container">
      <div className="space-y-4 bg-surface-low px-4 py-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-md bg-black px-9 py-2 text-sm outline-none transition focus-visible:ring-1 focus-visible:ring-primary/80"
          />
        </div>
        <div className="flex gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "rounded-md px-3 py-2 label-meta transition-all",
                queueFilter === filter.id
                  ? "bg-surface-bright text-primary shadow-[inset_0_0_0_1px_rgb(163_166_255_/_0.4)]"
                  : "bg-black/70 text-muted-foreground hover:text-foreground"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto">
        {leads.map((lead) => {
          const selected = lead.id === selectedLeadId;
          return (
            <button
              key={lead.id}
              type="button"
              className={cn(
                "w-full px-4 py-4 text-left transition-colors",
                selected
                  ? "bg-surface-container-low shadow-[inset_3px_0_0_0_#a3a6ff]"
                  : "hover:bg-surface-container-low/60"
              )}
              onClick={() => onSelectLead(lead.id)}
            >
              <div className="mb-1 flex items-start justify-between gap-3">
                <p className="font-headline text-2xl font-semibold text-white display-tight">{lead.name}</p>
                <span className="rounded-md bg-secondary/20 px-2 py-0.5 text-xs font-bold text-secondary">
                  {lead.score}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {lead.title} @ {lead.company}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className={cn("label-meta", statusText(lead.status))}>
                  {statusLabel(lead.status)}
                </span>
                <span className="text-xs text-muted-foreground">{lead.updatedAt}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function ComposerPanel({
  lead,
  aiPolishing,
  subject,
  body,
  onSubjectChange,
  onBodyChange,
  onToggleAiPolishing,
}: {
  lead: WorkspaceLeadItem;
  aiPolishing: boolean;
  subject: string;
  body: string;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onToggleAiPolishing: () => void;
}) {
  return (
    <section className="space-y-4 rounded-xl bg-surface-container p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-bright text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-headline text-3xl font-bold display-tight text-white">{lead.name}</p>
            <p className="text-secondary">
              {lead.title}, {lead.company}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="mb-1 flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-black">
              <div className="h-full w-[98%] bg-primary shadow-[0_0_10px_rgb(163_166_255_/_0.7)]" />
            </div>
            <span className="text-sm font-bold text-primary">98% Match</span>
          </div>
          <p className="label-meta text-muted-foreground">Tier 1 Strategic ICP</p>
        </div>
      </div>

      <div className="space-y-4">
        <article className="rounded-lg bg-surface-low p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="label-meta text-muted-foreground">Subject Line</span>
            <span className="rounded-md bg-secondary/10 px-2 py-1 text-xs font-semibold text-secondary">
              8.2% Open Rate Est.
            </span>
          </div>
          <p className="text-lg font-semibold text-white">
            {subject || "Subject not generated yet"}
          </p>
        </article>

        <article className="relative min-h-[20rem] rounded-lg bg-surface-low p-5">
          <div className="mb-4 flex items-center justify-between border-b border-outline-variant/15 pb-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="label-meta">AI Draft v2.1</span>
            </div>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground"
              onClick={onToggleAiPolishing}
            >
              Toggle AI Pulse
            </button>
          </div>
          <div className="space-y-4 text-lg leading-relaxed text-foreground/90">
            <input
              value={subject}
              onChange={(event) => onSubjectChange(event.target.value)}
              className="w-full rounded-md border border-outline-variant/30 bg-black px-3 py-2 text-sm text-white outline-none focus-visible:ring-1 focus-visible:ring-primary/70"
              placeholder="Subject line"
            />
            <textarea
              value={body}
              onChange={(event) => onBodyChange(event.target.value)}
              className="min-h-[14rem] w-full rounded-md border border-outline-variant/30 bg-black px-3 py-2 text-sm text-white outline-none focus-visible:ring-1 focus-visible:ring-primary/70"
              placeholder="Draft body"
            />
          </div>
          {aiPolishing && (
            <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1.5 shadow-[0_0_16px_rgb(163_166_255_/_0.25)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="label-meta text-foreground">AI Polishing...</span>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

export function SignalPanel({
  score = 0,
  breakdown = {},
}: {
  score?: number;
  breakdown?: Record<string, number>;
}) {
  const icpFit = Math.max(0, Math.min(100, Math.round((breakdown.icpFit ?? 0.4) * 100)));
  const relevance = Math.max(0, Math.min(100, Math.round((breakdown.relevance ?? 0.4) * 100)));
  const intent = Math.max(0, Math.min(100, Math.round((breakdown.intent ?? 0.4) * 100)));

  return (
    <div className="space-y-4">
      <article className="rounded-xl bg-surface-container p-5">
        <h4 className="label-meta mb-4 text-muted-foreground">Signal Breakdown</h4>
        <div className="space-y-4">
          {[
            { label: "ICP Fit", value: `${icpFit}%`, width: `${icpFit}%`, color: "bg-secondary" },
            { label: "Relevance", value: `${relevance}%`, width: `${relevance}%`, color: "bg-secondary" },
            { label: "Intent", value: `${intent}%`, width: `${intent}%`, color: "bg-primary" },
          ].map((metric) => (
            <div key={metric.label}>
              <div className="mb-1 flex justify-between">
                <span className="label-meta text-foreground">{metric.label}</span>
                <span className="label-meta text-secondary">{metric.value}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-black">
                <div className={cn("h-full", metric.color)} style={{ width: metric.width }} />
              </div>
            </div>
          ))}
        </div>
      </article>

      <GlassPanel className="space-y-4 shadow-[0_0_20px_rgb(163_166_255_/_0.06)]">
        <h4 className="flex items-center justify-between text-sm font-bold uppercase tracking-[0.08em] text-primary">
          Email Score
          <span className="font-headline text-4xl display-tight text-primary">{score}/100</span>
        </h4>
        <div className="space-y-3">
          {[
            ["Hyper-Personalized", "Mentioned recent hiring surge"],
            ["Value Proposition", "Clear link to 3x volume increase"],
            ["Call to Action", "Specific and low friction"],
          ].map(([title, subtitle]) => (
            <div key={title} className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-secondary" />
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      <article className="rounded-xl bg-surface-low p-5 shadow-[inset_1px_0_0_0_rgb(255_111_126_/_0.6)]">
        <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-tertiary">
          <AlertTriangle className="h-4 w-4" />
          Flags
        </h4>
        <div className="rounded-lg bg-tertiary/5 p-3">
          <p className="text-sm font-semibold text-foreground">Competitor Mention</p>
          <p className="mt-1 text-xs text-muted-foreground">
            TechFlow is a direct competitor of Veridian in the EMEA region.
          </p>
        </div>
      </article>
    </div>
  );
}

export function ImportProcessor({
  state,
  progress,
  steps,
  filename,
  importSummary,
  importLogs,
  onSelectFile,
  onDownloadTemplate,
  onGoToWorkspace,
  onReset,
}: {
  state: "idle" | "uploading" | "processing" | "complete" | "error";
  progress: number;
  steps: ImportStepItem[];
  filename?: string;
  importSummary?: string;
  importLogs?: Array<{ rowNumber: number; status: string; errorReason?: string }>;
  onSelectFile: (file: File) => void;
  onDownloadTemplate: () => void;
  onGoToWorkspace: () => void;
  onReset: () => void;
}) {
  const processing = state === "uploading" || state === "processing";
  const complete = state === "complete";
  const activeStepIndex = complete ? 2 : progress >= 66 ? 2 : progress >= 34 ? 1 : 0;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl bg-surface-container">
        <div className="flex items-center justify-between border-b border-outline-variant/10 p-8">
          <div>
            <h3 className="font-headline text-4xl font-bold display-tight text-white">Upload Lead Data</h3>
            <p className="mt-2 text-lg text-muted-foreground">
              Import your prospect list to start generating AI-driven outreach.
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 label-meta text-primary">
            CSV or XLSX
          </span>
        </div>
        <div className="p-8">
          <button
            type="button"
            onClick={() => {
              const input = document.getElementById("import-file-input") as HTMLInputElement | null;
              input?.click();
            }}
            className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant/35 bg-surface-low p-16 transition-colors hover:border-primary/50"
          >
            <input
              id="import-file-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) onSelectFile(selected);
              }}
            />
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low text-primary">
              <UploadCloud className="h-8 w-8" />
            </div>
            <p className="font-headline text-4xl font-bold display-tight text-white">
              Drag and drop leads file here
            </p>
            <p className="mt-2 text-lg text-muted-foreground">or click to browse your computer</p>
            <span className="mt-8 rounded-lg bg-surface-container-low px-8 py-3 label-meta text-foreground">
              Select File
            </span>
            <span
              role="button"
              tabIndex={0}
              className="mt-2 text-xs text-secondary"
              onClick={(event) => {
                event.stopPropagation();
                onDownloadTemplate();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onDownloadTemplate();
                }
              }}
            >
              Download sample template
            </span>
            {filename && <span className="mt-3 text-xs text-muted-foreground">Selected: {filename}</span>}
          </button>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-2xl bg-surface-container p-8">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(163,166,255,0.08),transparent)] opacity-60" />
        <div className="relative z-10 space-y-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Clock3 className={cn("h-5 w-5", processing && "animate-spin")} />
              </div>
              <div>
                <h3 className="font-headline text-4xl font-bold display-tight text-white">Quantum Processing</h3>
                <p className="text-lg text-muted-foreground">
                  Analyzing 150 new leads against your ICP and CRM...
                </p>
              </div>
            </div>
            <span className="font-headline text-4xl font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${Math.max(6, progress)}%` }}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => {
              const done = complete || index < activeStepIndex;
              const active = index === activeStepIndex && !complete;
              return (
                <article
                  key={step.id}
                  className={cn(
                    "rounded-xl p-4 transition-colors",
                    done || active ? "bg-surface-container-low" : "bg-surface-low opacity-55"
                  )}
                >
                  <div className="mb-2 flex items-center gap-2">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-secondary" />
                    ) : active ? (
                      <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <p className={cn("label-meta", active ? "text-primary" : "text-muted-foreground")}>
                      {step.title}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </article>
              );
            })}
          </div>
          {state === "error" && (
            <div className="rounded-lg bg-tertiary/10 p-4 text-sm text-tertiary">
              Import failed. Check source format and retry.
            </div>
          )}
        </div>
      </section>

      <GlassPanel className="rounded-2xl p-8 shadow-[0_0_35px_rgb(163_166_255_/_0.08)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="flex-1">
            <h3 className="font-headline text-4xl font-bold display-tight text-white">Import Complete</h3>
            <p className="mt-2 text-lg text-muted-foreground">
              {importSummary || "Import finished."}
            </p>
          </div>
          <div className="space-y-3 md:min-w-[220px]">
            <button
              type="button"
              className="btn-primary-lithic flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 label-meta shadow-[0_0_20px_rgb(163_166_255_/_0.3)]"
              onClick={onGoToWorkspace}
            >
              Go to Workspace
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="w-full rounded-lg px-6 py-2.5 label-meta text-muted-foreground transition-colors hover:text-foreground"
              onClick={onReset}
            >
              View Import Log
            </button>
          </div>
        </div>
        {importLogs && importLogs.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-lg bg-black/35 p-4">
            <table className="w-full text-left text-xs text-muted-foreground">
              <thead>
                <tr>
                  <th className="py-1">Row</th>
                  <th className="py-1">Status</th>
                  <th className="py-1">Reason</th>
                </tr>
              </thead>
              <tbody>
                {importLogs.slice(0, 10).map((log) => (
                  <tr key={`${log.rowNumber}-${log.status}`} className="border-t border-outline-variant/15">
                    <td className="py-1">{log.rowNumber}</td>
                    <td className="py-1">{log.status}</td>
                    <td className="py-1">{log.errorReason || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

export function AnalyticsTable({
  rows,
  search,
  filter,
  onSearchChange,
  onFilterChange,
}: {
  rows: AnalyticsRow[];
  search: string;
  filter: "all" | "converted" | "responded" | "contacted";
  onSearchChange: (value: string) => void;
  onFilterChange: (value: "all" | "converted" | "responded" | "contacted") => void;
}) {
  const filtered = rows.filter((row) => {
    const matchFilter = filter === "all" ? true : row.status === filter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      q.length === 0 ||
      row.leadName.toLowerCase().includes(q) ||
      row.company.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <section className="space-y-4 rounded-xl bg-surface-container p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-headline text-3xl font-bold display-tight text-white">Live Processing Stream</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search analytics..."
              className="rounded-md bg-black px-8 py-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-primary/70"
            />
          </div>
          <select
            className="rounded-md bg-surface-low px-3 py-2 text-xs uppercase tracking-[0.08em] text-muted-foreground outline-none focus-visible:ring-1 focus-visible:ring-primary/70"
            value={filter}
            onChange={(event) => onFilterChange(event.target.value as "all" | "converted" | "responded" | "contacted")}
          >
            <option value="all">Status: All</option>
            <option value="converted">Converted</option>
            <option value="responded">Responded</option>
            <option value="contacted">Contacted</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="label-meta text-muted-foreground">
            <tr>
              <th className="pb-3">Lead Name</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">Signal Score</th>
              <th className="pb-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-outline-variant/15">
                <td className="py-4">
                  <p className="font-semibold text-white">{row.leadName}</p>
                  <p className="text-xs text-muted-foreground">{row.company}</p>
                </td>
                <td className="py-4">
                  <span className="rounded-md bg-secondary/15 px-2 py-1 label-meta text-secondary">
                    {row.status}
                  </span>
                </td>
                <td className="py-4 text-right font-mono text-secondary">
                  {row.signalScore.toFixed(1)}
                </td>
                <td className="py-4 text-muted-foreground">{row.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function FunnelCard({
  metrics = { processed: 0, contacted: 0, converted: 0 },
}: {
  metrics?: { processed: number; contacted: number; converted: number };
}) {
  const contactedPct = metrics.processed > 0 ? (metrics.contacted / metrics.processed) * 100 : 0;
  const convertedPct = metrics.processed > 0 ? (metrics.converted / metrics.processed) * 100 : 0;
  const bars = [
    { label: "Processed", value: String(metrics.processed), width: "100%", color: "bg-primary" },
    { label: "Contacted", value: String(metrics.contacted), width: `${Math.max(contactedPct, 2)}%`, color: "bg-secondary" },
    { label: "Converted", value: String(metrics.converted), width: `${Math.max(convertedPct, 1)}%`, color: "bg-white" },
  ];

  return (
    <article className="rounded-xl bg-surface-container p-6">
      <h3 className="font-headline text-3xl font-bold display-tight text-white">Conversion Funnel</h3>
      <div className="mt-6 space-y-6">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="mb-2 flex justify-between label-meta text-muted-foreground">
              <span>{bar.label}</span>
              <span>{bar.value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
              <div className={cn("h-full rounded-full", bar.color)} style={{ width: bar.width }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 border-t border-outline-variant/15 pt-6 text-sm text-muted-foreground">
        <p>
          AI predicts <span className="font-bold text-white">45+ new conversions</span> by EOD based on current
          engagement velocity.
        </p>
      </div>
    </article>
  );
}
