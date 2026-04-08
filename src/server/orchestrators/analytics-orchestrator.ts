import { getDb } from "../core/db";
import { getDefaultUserId } from "../core/identity";

export async function getAnalyticsSummary() {
  const db = getDb();
  const userId = await getDefaultUserId();

  const [totalLeads, contacted, replies, approvals, approved] = await Promise.all([
    db.lead.count({ where: { userId } }),
    db.lead.count({ where: { userId, lifecycle: { in: ["sent", "replied", "negotiating", "won", "lost"] } } }),
    db.lead.count({ where: { userId, lifecycle: { in: ["replied", "negotiating", "won", "lost"] } } }),
    db.approval.count({ where: { userId } }),
    db.approval.count({ where: { userId, status: "approved" } }),
  ]);

  const conversion = totalLeads ? (replies / totalLeads) * 100 : 0;
  const contactRate = totalLeads ? (contacted / totalLeads) * 100 : 0;
  const approvalRate = approvals ? (approved / approvals) * 100 : 0;

  return {
    totalLeads,
    contacted,
    contactRate,
    conversionRate: conversion,
    approvalRate,
  };
}

export async function getLiveProcessingStream(params: { search?: string; status?: string }) {
  const db = getDb();
  const userId = await getDefaultUserId();

  const leads = await db.lead.findMany({
    where: {
      userId,
      ...(params.search
        ? {
            OR: [
              { firstName: { contains: params.search, mode: "insensitive" } },
              { lastName: { contains: params.search, mode: "insensitive" } },
              { company: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(params.status && params.status !== "all"
        ? {
            lifecycle:
              params.status === "converted"
                ? "won"
                : params.status === "responded"
                ? "replied"
                : "sent",
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return leads.map((lead) => ({
    id: lead.id,
    leadName: `${lead.firstName} ${lead.lastName}`,
    company: lead.company,
    status:
      lead.lifecycle === "won"
        ? "converted"
        : lead.lifecycle === "replied" || lead.lifecycle === "negotiating"
        ? "responded"
        : "contacted",
    signalScore: lead.score || 0,
    timestamp: lead.updatedAt.toISOString(),
  }));
}

export async function getFunnelMetrics() {
  const db = getDb();
  const userId = await getDefaultUserId();

  const [processed, contacted, converted] = await Promise.all([
    db.lead.count({ where: { userId } }),
    db.lead.count({ where: { userId, lifecycle: { in: ["sent", "replied", "negotiating", "won", "lost"] } } }),
    db.lead.count({ where: { userId, lifecycle: "won" } }),
  ]);

  return { processed, contacted, converted };
}

export async function getApprovalAnalytics() {
  const db = getDb();
  const userId = await getDefaultUserId();

  const [total, approved, rejected] = await Promise.all([
    db.approval.count({ where: { userId } }),
    db.approval.count({ where: { userId, status: "approved" } }),
    db.approval.count({ where: { userId, status: "rejected" } }),
  ]);

  return { total, approved, rejected };
}

export async function getDerivedInsights() {
  const db = getDb();
  const userId = await getDefaultUserId();

  const highScoring = await db.lead.count({ where: { userId, score: { gte: 90 } } });
  const total = await db.lead.count({ where: { userId } });
  const rejectedPricing = await db.message.count({
    where: {
      userId,
      lifecycle: "rejected",
      replyIntent: "pricing",
    },
  });

  return {
    highPrecisionVectors: [
      `Leads with score >= 90: ${highScoring}/${Math.max(total, 1)} (${((highScoring / Math.max(total, 1)) * 100).toFixed(1)}%)`,
      "Fast follow-up and strong personalization correlate with higher approvals.",
      "Leads with referral/linkedin source tend to convert faster.",
    ],
    frictionAnalysis: [
      `Rejected pricing-related drafts: ${rejectedPricing}`,
      "Aggressive tone and unclear pricing terms increase rejection likelihood.",
      "Low-score leads often require stronger proof points before send approval.",
    ],
  };
}
