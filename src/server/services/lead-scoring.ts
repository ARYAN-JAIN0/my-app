import { Lead } from "@prisma/client";

export function scoreLead(lead: Pick<Lead, "title" | "source" | "company">) {
  let score = 45;
  const signals: Record<string, number> = {
    icpFit: 0,
    relevance: 0,
    intent: 0,
  };

  if (lead.title?.toLowerCase().includes("vp") || lead.title?.toLowerCase().includes("head")) {
    score += 25;
    signals.icpFit += 0.4;
  }
  if (lead.source === "referral" || lead.source === "linkedin") {
    score += 15;
    signals.intent += 0.3;
  }
  if (lead.company.length > 5) {
    score += 10;
    signals.relevance += 0.2;
  }

  if (score > 100) score = 100;

  const confidence = Math.min(0.99, 0.55 + score / 200);
  return { score, confidence, signals };
}

export function classifyNeedsAction(lifecycle: string) {
  return ["pending_approval", "replied", "negotiating"].includes(lifecycle);
}

export function needsEscalation(intent: string, turnCount: number) {
  if (turnCount >= 5) return true;
  return intent === "pricing" || intent === "objection";
}
