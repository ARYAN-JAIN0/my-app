import { getDb } from "../core/db";
import { getDefaultUserId } from "../core/identity";

export async function getAnalyticsSummary() {
  const db = getDb();
  const userId = await getDefaultUserId();

  const [totalLeads, contacted, replies, approvals, approved] = await Promise.all([
    db.lead.count({ where: { userId } }),
    db.analyticsEvent.count({ where: { userId, type: "email_sent" } }),
    db.analyticsEvent.count({ where: { userId, type: "reply_received" } }),
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

  const statusToTypes: Record<string, string[]> = {
    converted: ["lead_converted"],
    responded: ["reply_received"],
    contacted: ["email_sent"],
  };
  const eventTypes = params.status && params.status !== "all" ? statusToTypes[params.status] || [] : ["email_sent", "reply_received", "lead_converted", "lead_created", "draft_generated"];

  const events = await db.analyticsEvent.findMany({
    where: {
      userId,
      type: { in: eventTypes.length > 0 ? eventTypes : ["email_sent", "reply_received"] },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const leadIds = [...new Set(events.map((event) => event.leadId).filter(Boolean) as string[])];
  const leads = leadIds.length > 0 ? await db.lead.findMany({ where: { id: { in: leadIds } } }) : [];
  const leadMap = new Map(leads.map((lead) => [lead.id, lead]));

  return events
    .map((event) => {
      const lead = event.leadId ? leadMap.get(event.leadId) : null;
      if (!lead) return null;
      const leadName = `${lead.firstName} ${lead.lastName}`.trim();
      const status =
        event.type === "lead_converted"
          ? "converted"
          : event.type === "reply_received"
          ? "responded"
          : "contacted";

      return {
        id: event.id,
        leadName,
        company: lead.company,
        status,
        signalScore: lead.score || 0,
        timestamp: event.createdAt.toISOString(),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => {
      if (!params.search) return true;
      const query = params.search.toLowerCase();
      return item.leadName.toLowerCase().includes(query) || item.company.toLowerCase().includes(query);
    });
}

export async function getFunnelMetrics() {
  const db = getDb();
  const userId = await getDefaultUserId();

  const [processed, contacted, converted] = await Promise.all([
    db.lead.count({ where: { userId } }),
    db.analyticsEvent.count({ where: { userId, type: "email_sent" } }),
    db.analyticsEvent.count({ where: { userId, type: "lead_converted" } }),
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
    where: { userId, lifecycle: "rejected", replyIntent: "pricing" },
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
