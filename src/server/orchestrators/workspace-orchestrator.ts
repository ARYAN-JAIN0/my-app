import { LeadLifecycle, Prisma } from "@prisma/client";
import { getDb } from "../core/db";
import { getDefaultUserId } from "../core/identity";
import { AppError } from "../core/http";
import { buildLeadScoreExplanation, generateOutboundDraft } from "../services/ai-tasks";
import { sendGmailMessage } from "../integrations/gmail";

function toQueueStatus(lifecycle: LeadLifecycle): "needs-approval" | "draft" | "ready" {
  if (lifecycle === "pending_approval" || lifecycle === "replied" || lifecycle === "negotiating") {
    return "needs-approval";
  }
  if (lifecycle === "approved") return "ready";
  return "draft";
}

export async function getWorkspaceData(params: { search?: string; filter?: "priority" | "score" | "needs-action" }) {
  const db = getDb();
  const userId = await getDefaultUserId();

  const where: Prisma.LeadWhereInput = {
    userId,
    ...(params.search
      ? {
          OR: [
            { firstName: { contains: params.search, mode: "insensitive" } },
            { lastName: { contains: params.search, mode: "insensitive" } },
            { email: { contains: params.search, mode: "insensitive" } },
            { company: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(params.filter === "needs-action" ? { needsAction: true } : {}),
  };

  const orderBy: Prisma.LeadOrderByWithRelationInput[] =
    params.filter === "score"
      ? [{ score: "desc" }, { updatedAt: "desc" }]
      : params.filter === "priority"
      ? [{ priority: "desc" }, { updatedAt: "desc" }]
      : [{ updatedAt: "desc" }];

  const leads = await db.lead.findMany({
    where,
    orderBy,
    take: 100,
    include: {
      messages: {
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [pendingApprovals, sentToday, totalNew, totalApprovals, approvedApprovals] = await Promise.all([
    db.approval.count({ where: { userId, status: "pending" } }),
    db.message.count({ where: { userId, lifecycle: "sent", sentAt: { gte: startOfDay } } }),
    db.lead.count({ where: { userId, createdAt: { gte: startOfDay } } }),
    db.approval.count({ where: { userId } }),
    db.approval.count({ where: { userId, status: "approved" } }),
  ]);

  const approvalRate = totalApprovals > 0 ? ((approvedApprovals / totalApprovals) * 100).toFixed(1) : "0.0";

  return {
    kpis: [
      { id: "new-leads", label: "New Leads", value: String(totalNew), hint: "Today", accent: "primary" as const },
      {
        id: "pending-approval",
        label: "Pending Approval",
        value: String(pendingApprovals),
        hint: pendingApprovals > 0 ? "Needs review" : "Clear",
        accent: pendingApprovals > 0 ? ("tertiary" as const) : ("neutral" as const),
      },
      {
        id: "emails-sent",
        label: "Emails Sent Today",
        value: String(sentToday),
        hint: "Live",
        accent: "secondary" as const,
      },
      {
        id: "approval-rate",
        label: "Approval Rate",
        value: `${approvalRate}%`,
        hint: "From approvals",
        accent: "neutral" as const,
      },
    ],
    leads: leads.map((lead) => ({
      id: lead.id,
      name: `${lead.firstName} ${lead.lastName}`,
      title: lead.title || "Unknown",
      company: lead.company,
      score: lead.score || 0,
      status: toQueueStatus(lead.lifecycle),
      updatedAt: lead.updatedAt.toISOString(),
      subject: lead.messages[0]?.subject || "",
      body: lead.messages[0]?.body || "",
      signalBreakdown: (lead.signalBreakdown ?? {}) as Record<string, number>,
      confidenceScore: lead.confidenceScore || 0,
    })),
  };
}

export async function getLeadDetail(leadId: string) {
  const db = getDb();
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    include: {
      messages: {
        orderBy: { updatedAt: "desc" },
        take: 10,
      },
      approvals: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!lead) throw new AppError("not_found", 404, "Lead not found");

  return lead;
}

export async function saveDraft(leadId: string, subject: string, body: string) {
  const db = getDb();
  const userId = await getDefaultUserId();

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new AppError("not_found", 404, "Lead not found");

  const latest = await db.message.findFirst({
    where: { leadId },
    orderBy: { updatedAt: "desc" },
  });

  if (!latest) {
    const message = await db.message.create({
      data: {
        userId,
        leadId,
        subject,
        body,
        lifecycle: "saved",
        direction: "outbound",
      },
    });
    return message;
  }

  return db.message.update({
    where: { id: latest.id },
    data: {
      subject,
      body,
      lifecycle: "saved",
    },
  });
}

export async function regenerateDraft(leadId: string) {
  const db = getDb();
  const userId = await getDefaultUserId();
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new AppError("not_found", 404, "Lead not found");

  const draft = await generateOutboundDraft(lead);

  const message = await db.message.create({
    data: {
      userId,
      leadId,
      subject: draft.subject,
      body: draft.body,
      lifecycle: "pending_approval",
      direction: "outbound",
      metadata: {
        regenerated: true,
      },
    },
  });

  await db.approval.create({
    data: {
      userId,
      leadId,
      messageId: message.id,
      status: "pending",
    },
  });

  await db.lead.update({
    where: { id: leadId },
    data: {
      lifecycle: "pending_approval",
      needsAction: true,
      signalBreakdown: draft.signalBreakdown as Prisma.InputJsonValue,
      confidenceScore: draft.confidenceScore,
    },
  });

  return message;
}

export async function rejectDraft(leadId: string) {
  const db = getDb();

  const message = await db.message.findFirst({
    where: { leadId },
    orderBy: { updatedAt: "desc" },
  });
  if (!message) throw new AppError("not_found", 404, "No draft found");

  await db.message.update({
    where: { id: message.id },
    data: { lifecycle: "rejected" },
  });

  await db.approval.updateMany({
    where: { messageId: message.id, status: "pending" },
    data: { status: "rejected", reviewedAt: new Date() },
  });

  await db.lead.update({
    where: { id: leadId },
    data: { lifecycle: "rejected", needsAction: true },
  });
}

export async function approveAndSend(leadId: string) {
  const db = getDb();
  const userId = await getDefaultUserId();

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new AppError("not_found", 404, "Lead not found");

  const message = await db.message.findFirst({
    where: { leadId, direction: "outbound" },
    orderBy: { updatedAt: "desc" },
  });
  if (!message) throw new AppError("not_found", 404, "No draft available");

  const account = await db.gmailAccount.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });

  const sendResult = await sendGmailMessage(
    account,
    lead.email,
    message.subject,
    message.body,
    message.threadId || undefined
  );

  let threadId = message.threadId;
  if (!threadId) {
    const thread = await db.thread.upsert({
      where: { gmailThreadId: sendResult.threadId },
      update: { subject: message.subject },
      create: { userId, gmailThreadId: sendResult.threadId, subject: message.subject },
    });
    threadId = thread.id;

    await db.threadLead.upsert({
      where: { threadId_leadId: { threadId: thread.id, leadId } },
      update: {},
      create: { threadId: thread.id, leadId },
    });
  }

  const updatedMessage = await db.message.update({
    where: { id: message.id },
    data: {
      lifecycle: "sent",
      gmailMessageId: sendResult.id,
      sentAt: new Date(),
      threadId,
    },
  });

  await db.approval.updateMany({
    where: { messageId: message.id, status: "pending" },
    data: { status: "approved", reviewedAt: new Date() },
  });

  await db.lead.update({
    where: { id: leadId },
    data: {
      lifecycle: "sent",
      needsAction: false,
      lastContactedAt: new Date(),
    },
  });

  await db.analyticsEvent.create({
    data: {
      userId,
      type: "email_sent",
      leadId,
      messageId: updatedMessage.id,
    },
  });

  for (const dayOffset of [2, 5, 10]) {
    await db.followup.upsert({
      where: { leadId_dayOffset: { leadId, dayOffset } },
      update: { status: "scheduled", dueAt: new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000) },
      create: {
        userId,
        leadId,
        dayOffset,
        dueAt: new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000),
        status: "scheduled",
      },
    });
  }

  return updatedMessage;
}

export async function getPendingApprovals() {
  const db = getDb();
  const userId = await getDefaultUserId();

  return db.approval.findMany({
    where: { userId, status: "pending" },
    include: {
      lead: true,
      message: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function leadScoreExplanation(leadId: string) {
  const db = getDb();
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new AppError("not_found", 404, "Lead not found");
  return buildLeadScoreExplanation(lead);
}
