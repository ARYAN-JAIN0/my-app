export type DealStage = "prospect" | "qualification" | "proposal" | "negotiation" | "closed-won" | "closed-lost";

export interface Deal {
  id: string;
  name: string;
  value: number;
  stage: DealStage;
  status: "active" | "won" | "lost";
  closeDate?: string;
  createdAt: string;
  updatedAt: string;
  contactId: string;
  accountId: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  title: string;
  status: "lead" | "contact" | "customer";
}

export interface Account {
  id: string;
  name: string;
  industry: string;
  website?: string;
  employees?: number;
  annualRevenue?: number;
}
