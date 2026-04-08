export interface NegotiationDeal {
  id: string;
  dealName: string;
  leadId: string;
  leadName: string;
  company: string;
  basePrice: number;
  targetPrice: number;
  floorPrice: number;
  currentOffer: number;
  stage: "initial" | "counter" | "final" | "closed";
  status: "active" | "won" | "lost";
  createdAt: string;
  updatedAt: string;
}

export interface NegotiationMetrics {
  averageDealSize: number;
  winRate: number;
  averageCycleTime: number;
  concessionsMade: number;
}
