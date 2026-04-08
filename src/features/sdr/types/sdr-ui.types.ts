export type WorkspaceQueueStatus =
  | "needs-approval"
  | "draft"
  | "ready";

export interface WorkspaceKpiItem {
  id: string;
  label: string;
  value: string;
  hint: string;
  accent: "primary" | "secondary" | "tertiary" | "neutral";
}

export interface WorkspaceLeadItem {
  id: string;
  name: string;
  title: string;
  company: string;
  score: number;
  status: WorkspaceQueueStatus;
  updatedAt: string;
  subject?: string;
  body?: string;
  signalBreakdown?: Record<string, number>;
  confidenceScore?: number;
  emailScore: number;
  flags: Array<{
    title: string;
    detail: string;
    severity: "info" | "warning" | "critical";
  }>;
}

export interface ImportStepItem {
  id: string;
  title: string;
  description: string;
}

export interface AnalyticsRow {
  id: string;
  leadName: string;
  company: string;
  status: "converted" | "responded" | "contacted";
  signalScore: number;
  timestamp: string;
}
