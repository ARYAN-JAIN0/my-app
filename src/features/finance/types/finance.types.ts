export type DealStatus = "prospect" | "qualification" | "proposal" | "negotiation" | "won" | "lost";

export interface Deal {
  id: string;
  name: string;
  value: number;
  stage: string;
  status: DealStatus;
  closeDate?: string;
  createdAt: string;
  updatedAt: string;
  contactId: string;
  accountId: string;
}

export interface RevenueForecast {
  period: "monthly" | "quarterly" | "annually";
  forecasts: number[];
  confidenceIntervals: { lower: number; upper: number }[];
  pipelineValue: number;
  expectedRevenue: number;
  calculatedAt: string;
}

export interface FinancialMetric {
  name: string;
  value: number;
  change: number;
  trend: "up" | "down" | "neutral";
  period: string;
}
