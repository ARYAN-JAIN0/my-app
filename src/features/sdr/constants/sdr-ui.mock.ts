import type {
  AnalyticsRow,
  ImportStepItem,
  WorkspaceKpiItem,
  WorkspaceLeadItem,
} from "../types/sdr-ui.types";

export const workspaceKpis: WorkspaceKpiItem[] = [
  { id: "new-leads", label: "New Leads", value: "124", hint: "+12%", accent: "primary" },
  {
    id: "pending-approval",
    label: "Pending Approval",
    value: "28",
    hint: "Urgent",
    accent: "tertiary",
  },
  {
    id: "emails-sent",
    label: "Emails Sent Today",
    value: "142",
    hint: "Goal: 200",
    accent: "secondary",
  },
  {
    id: "approval-rate",
    label: "Approval Rate",
    value: "94.2%",
    hint: "Optimal",
    accent: "neutral",
  },
];

export const workspaceLeads: WorkspaceLeadItem[] = [
  {
    id: "sarah-jenkins",
    name: "Sarah Jenkins",
    title: "VP Marketing",
    company: "Veridian AI",
    score: 98,
    status: "needs-approval",
    updatedAt: "2h ago",
  },
  {
    id: "michael-chen",
    name: "Michael Chen",
    title: "Head of Sales",
    company: "TechFlow",
    score: 84,
    status: "draft",
    updatedAt: "4h ago",
  },
  {
    id: "elena-rodriguez",
    name: "Elena Rodriguez",
    title: "CTO",
    company: "DataNexus",
    score: 91,
    status: "draft",
    updatedAt: "1d ago",
  },
];

export const importSteps: ImportStepItem[] = [
  {
    id: "store",
    title: "Storing Data",
    description: "Securing lead records in encrypted workspace.",
  },
  {
    id: "rag",
    title: "Running RAG Analysis",
    description: "Pulling company signals and personal triggers.",
  },
  {
    id: "drafts",
    title: "Generating AI Drafts",
    description: "Writing hyper-personalized touchpoints.",
  },
];

export const analyticsRows: AnalyticsRow[] = [
  {
    id: "1",
    leadName: "Alex Rivera",
    company: "Global Tech Corp",
    status: "converted",
    signalScore: 98.4,
    timestamp: "2m ago",
  },
  {
    id: "2",
    leadName: "Sarah Chen",
    company: "Nexus Logistics",
    status: "responded",
    signalScore: 92.1,
    timestamp: "14m ago",
  },
  {
    id: "3",
    leadName: "Marcus Thorne",
    company: "BioGen Dynamics",
    status: "contacted",
    signalScore: 85.7,
    timestamp: "1h ago",
  },
  {
    id: "4",
    leadName: "Elena Rodriguez",
    company: "Quantum Ventures",
    status: "converted",
    signalScore: 96.8,
    timestamp: "3h ago",
  },
];
