"use client";

import { useMemo, useState } from "react";
import {
  ComposerPanel,
  GlassPanel,
  KpiCard,
  LeadRail,
  SignalPanel,
} from "@/features/sdr/components/sdr-primitives";
import { EmptyState } from "@/components/shared/feedback/empty-state";
import { SdrLoading } from "@/components/shared/feedback/loading";
import { useWorkspaceData } from "@/features/sdr/hooks/use-workspace-data";

export default function SdrWorkspacePage() {
  const {
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
  } = useWorkspaceData();

  const [aiPolishing, setAiPolishing] = useState(true);
  const [subject, setSubject] = useState(() => selectedLead?.subject || "");
  const [body, setBody] = useState(() => selectedLead?.body || "");

  const selectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    const lead = leads.find((item) => item.id === leadId);
    setSubject(lead?.subject || "");
    setBody(lead?.body || "");
  };

  const queueStats = useMemo(() => {
    const needsApproval = leads.filter((lead) => lead.status === "needs-approval").length;
    const draft = leads.filter((lead) => lead.status === "draft").length;
    const ready = leads.filter((lead) => lead.status === "ready").length;
    return { needsApproval, draft, ready };
  }, [leads]);

  if (isLoading) {
    return <SdrLoading />;
  }

  if (error && !selectedLead) {
    return (
      <EmptyState
        title="Failed to load workspace"
        description={error}
        action={{ label: "Retry", onClick: refresh }}
      />
    );
  }

  if (!selectedLead) {
    return <EmptyState title="No leads found" description="Import leads to start drafting outreach." />;
  }

  return (
    <div className="space-y-6 pb-24">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <KpiCard key={item.id} item={item} />
        ))}
      </section>

      <GlassPanel className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          {[
            [`${queueStats.needsApproval} Emails`, "Needs Approval", "bg-tertiary"],
            [`${queueStats.draft} Drafts`, "Low Score", "bg-yellow-400"],
            [`${queueStats.ready} Ready`, "Auto-Send Queue", "bg-secondary"],
          ].map(([value, label, tone], idx) => (
            <div key={value} className="flex items-center gap-3">
              {idx > 0 && <div className="hidden h-10 w-px bg-outline-variant/25 md:block" />}
              <span className={`h-2 w-2 rounded-full ${tone}`} />
              <div>
                <p className="font-headline text-3xl font-bold display-tight text-white">{value}</p>
                <p className="label-meta text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn-primary-lithic rounded-lg px-6 py-3 font-headline font-semibold"
          onClick={() => setQueueFilter("needs-action")}
        >
          Review Pending Queue
        </button>
      </GlassPanel>

      {error && (
        <div className="rounded-md border border-tertiary/40 bg-tertiary/10 px-3 py-2 text-sm text-tertiary">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-3">
          <LeadRail
            leads={leads}
            selectedLeadId={selectedLeadId || selectedLead.id}
            queueFilter={queueFilter}
            search={search}
            onSearchChange={setSearch}
            onFilterChange={setQueueFilter}
            onSelectLead={selectLead}
          />
        </div>
        <div className="xl:col-span-6">
          <ComposerPanel
            lead={selectedLead}
            aiPolishing={aiPolishing}
            subject={subject}
            body={body}
            onSubjectChange={setSubject}
            onBodyChange={setBody}
            onToggleAiPolishing={() => setAiPolishing((value) => !value)}
          />
        </div>
        <div className="xl:col-span-3">
          <SignalPanel
            score={selectedLead.emailScore}
            breakdown={selectedLead.signalBreakdown}
            flags={selectedLead.flags}
          />
        </div>
      </div>

      <footer className="fixed bottom-0 right-0 left-0 z-30 border-t border-outline-variant/20 bg-background/85 px-4 py-3 backdrop-blur-md lg:left-64 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="label-meta text-muted-foreground">
            Current: {selectedLead.name} ({selectedLead.title})
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-outline-variant/25 px-4 py-2 label-meta text-foreground/70"
              onClick={() => saveDraft(subject, body)}
              disabled={isSaving}
            >
              Save Draft
            </button>
            <button
              type="button"
              className="rounded-lg border border-outline-variant/25 px-4 py-2 label-meta text-foreground/70"
              onClick={regenerateDraft}
              disabled={isSaving}
            >
              Regenerate
            </button>
            <button
              type="button"
              className="rounded-lg border border-tertiary/40 bg-tertiary/10 px-4 py-2 label-meta text-tertiary"
              onClick={rejectDraft}
              disabled={isSaving}
            >
              Reject
            </button>
            <button
              type="button"
              className="rounded-lg border-b-2 border-primary px-4 py-2 label-meta text-primary"
              onClick={() => saveDraft(subject, body)}
              disabled={isSaving}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn-primary-lithic rounded-lg px-6 py-2.5 label-meta shadow-[0_0_20px_rgb(163_166_255_/_0.3)]"
              onClick={approveDraft}
              disabled={isSaving || selectedLead.status === "ready"}
            >
              Approve
            </button>
            <button
              type="button"
              className="btn-primary-lithic rounded-lg px-6 py-2.5 label-meta shadow-[0_0_20px_rgb(52_181_250_/_0.3)]"
              onClick={sendApproved}
              disabled={isSaving || selectedLead.status !== "ready"}
            >
              Send
            </button>
            <button
              type="button"
              className="rounded-lg border border-outline-variant/25 px-4 py-2 label-meta text-foreground/70"
              onClick={async () => {
                await approveDraft();
                await sendApproved();
              }}
              disabled={isSaving}
            >
              Approve + Send
            </button>
            <button
              type="button"
              className="rounded-lg border border-outline-variant/25 px-4 py-2 label-meta text-foreground/70"
              onClick={refresh}
              disabled={isSaving}
            >
              Refresh
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
