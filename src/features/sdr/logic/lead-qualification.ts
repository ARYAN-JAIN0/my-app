import type { Lead, LeadQualification } from "@/features/sdr/types/sdr.types";

interface QualificationCriteria {
  budget: number;
  authority: "low" | "medium" | "high";
  timeline: "immediate" | "short" | "medium" | "long";
  need: "critical" | "important" | "nice-to-have";
}

export function qualifyLead(lead: Lead, criteria: QualificationCriteria): LeadQualification {
  let score = 0;
  const reasons: string[] = [];

  // Budget scoring
  if (lead.value) {
    if (lead.value >= criteria.budget * 0.8) {
      score += 30;
      reasons.push("Budget aligns with deal value");
    } else if (lead.value >= criteria.budget * 0.5) {
      score += 15;
      reasons.push("Partial budget alignment");
    } else {
      reasons.push("Budget may be insufficient");
    }
  }

  // Authority scoring
  if (criteria.authority === "high") {
    score += 25;
    reasons.push("Decision maker identified");
  } else if (criteria.authority === "medium") {
    score += 10;
    reasons.push("Influencer in the decision");
  }

  // Timeline scoring
  if (criteria.timeline === "immediate" || criteria.timeline === "short") {
    score += 25;
    reasons.push("Short sales timeline");
  } else if (criteria.timeline === "medium") {
    score += 10;
    reasons.push("Moderate timeline");
  }

  // Need scoring
  if (criteria.need === "critical") {
    score += 20;
    reasons.push("Critical business need");
  } else if (criteria.need === "important") {
    score += 10;
    reasons.push("Important use case");
  }

  // Determine fit
  let fit: "hot" | "warm" | "cold";
  let recommendedAction: string;

  if (score >= 70) {
    fit = "hot";
    recommendedAction = "Immediately schedule demo call";
  } else if (score >= 40) {
    fit = "warm";
    recommendedAction = "Add to nurture sequence and schedule follow-up";
  } else {
    fit = "cold";
    recommendedAction = "Add to long-term follow-up list";
  }

  return {
    leadId: lead.id,
    score: Math.min(score, 100),
    fit,
    reasons,
    recommendedAction,
  };
}

export function calculateLeadScore(lead: Lead): number {
  let score = 0;

  // Company size scoring
  if (lead.value) {
    if (lead.value > 100000) score += 30;
    else if (lead.value > 50000) score += 20;
    else if (lead.value > 10000) score += 10;
  }

  // Source scoring
  switch (lead.source) {
    case "referral":
      score += 25;
      break;
    case "website":
      score += 20;
      break;
    case "linkedin":
      score += 15;
      break;
    case "conference":
      score += 15;
      break;
    case "cold-outreach":
      score += 5;
      break;
  }

  // Priority scoring
  switch (lead.priority) {
    case "urgent":
      score += 25;
      break;
    case "high":
      score += 20;
      break;
    case "medium":
      score += 10;
      break;
    case "low":
      score += 5;
      break;
  }

  // Status scoring
  if (lead.status === "qualified") score += 20;
  else if (lead.status === "contacted") score += 10;
  else if (lead.status === "new") score += 5;

  return Math.min(score, 100);
}