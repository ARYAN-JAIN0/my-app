interface PipelineStage {
  id: string;
  name: string;
  probability: number;
  averageDays: number;
}

export const defaultPipelineStages: PipelineStage[] = [
  { id: "prospect", name: "Prospect", probability: 0.1, averageDays: 7 },
  { id: "qualification", name: "Qualification", probability: 0.25, averageDays: 14 },
  { id: "proposal", name: "Proposal", probability: 0.5, averageDays: 21 },
  { id: "negotiation", name: "Negotiation", probability: 0.75, averageDays: 14 },
  { id: "closed-won", name: "Closed Won", probability: 1.0, averageDays: 0 },
  { id: "closed-lost", name: "Closed Lost", probability: 0, averageDays: 0 },
];

export interface PipelineMetrics {
  totalValue: number;
  weightedValue: number;
  dealCount: number;
  averageDealSize: number;
  winProbability: number;
  expectedValue: number;
}

export function calculatePipelineMetrics(
  deals: { value: number; stage: string }[]
): PipelineMetrics {
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  
  let weightedValue = 0;
  let totalProbability = 0;
  let wonDeals = 0;
  let wonValue = 0;
  
  deals.forEach((deal) => {
    const stage = defaultPipelineStages.find((s) => s.id === deal.stage);
    if (stage) {
      weightedValue += deal.value * stage.probability;
      totalProbability += stage.probability;
      
      if (deal.stage === "closed-won") {
        wonDeals++;
        wonValue += deal.value;
      }
    }
  });
  
  const dealCount = deals.length;
  const averageDealSize = dealCount > 0 ? totalValue / dealCount : 0;
  const winProbability = dealCount > 0 ? totalProbability / dealCount : 0;
  const expectedValue = totalValue * winProbability;
  
  return {
    totalValue,
    weightedValue,
    dealCount,
    averageDealSize,
    winProbability,
    expectedValue,
  };
}

export function getStageProbability(stageId: string): number {
  const stage = defaultPipelineStages.find((s) => s.id === stageId);
  return stage?.probability ?? 0;
}

export function calculateDaysInStage(
  dealCreatedAt: string,
  stageCreatedAt: string,
  stageId: string
): number {
  const stage = defaultPipelineStages.find((s) => s.id === stageId);
  if (!stage || stage.averageDays === 0) return 0;
  
  const start = new Date(stageCreatedAt);
  const created = new Date(dealCreatedAt);
  const days = Math.floor((start.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  
  return days;
}

export function isStageAtRisk(
  daysInStage: number,
  averageDays: number
): boolean {
  return daysInStage > averageDays * 1.5;
}

export function predictDealOutcome(
  dealValue: number,
  currentStage: string,
  daysInStage: number
): { prediction: "likely-won" | "likely-lost" | "uncertain"; confidence: number } {
  const stage = defaultPipelineStages.find((s) => s.id === currentStage);
  if (!stage) {
    return { prediction: "uncertain", confidence: 0 };
  }
  
  const baseProbability = stage.probability;
  let adjustment = 0;
  
  // Adjust based on time in stage
  if (daysInStage > stage.averageDays * 2) {
    adjustment = -0.2;
  } else if (daysInStage > stage.averageDays * 1.5) {
    adjustment = -0.1;
  } else if (daysInStage < stage.averageDays * 0.5) {
    adjustment = 0.1;
  }
  
  const adjustedProbability = Math.max(0, Math.min(1, baseProbability + adjustment));
  
  let prediction: "likely-won" | "likely-lost" | "uncertain";
  let confidence: number;
  
  if (adjustedProbability > 0.7) {
    prediction = "likely-won";
    confidence = adjustedProbability;
  } else if (adjustedProbability < 0.3) {
    prediction = "likely-lost";
    confidence = 1 - adjustedProbability;
  } else {
    prediction = "uncertain";
    confidence = 1 - Math.abs(adjustedProbability - 0.5) * 2;
  }
  
  return { prediction, confidence };
}