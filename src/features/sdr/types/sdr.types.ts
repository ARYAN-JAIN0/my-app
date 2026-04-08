export type LeadStatus = "new" | "contacted" | "qualified" | "unqualified" | "converted";

export type LeadSource = "website" | "linkedin" | "referral" | "cold-outreach" | "conference";

export type LeadPriority = "low" | "medium" | "high" | "urgent";

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  title: string;
  status: LeadStatus;
  source: LeadSource;
  priority: LeadPriority;
  value?: number;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
}

export interface LeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
  priority?: LeadPriority;
  search?: string;
}

export interface LeadQualification {
  leadId: string;
  score: number;
  fit: "hot" | "warm" | "cold";
  reasons: string[];
  recommendedAction: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: "initial" | "followup" | "custom";
}
