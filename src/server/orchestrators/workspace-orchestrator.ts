import { LeadLifecycle, Prisma } from "@prisma/client";
import { getDb } from "../core/db";
import { getDefaultUserId } from "../core/identity";
import { AppError } from "../core/http";
import { buildLeadScoreExplanation, generateOutboundDraft } from "../services/ai-tasks";
import { refreshGoogleAccessToken, sendGmailMessage } from "../integrations/gmail";

function toQueueStatus(lifecycle: LeadLifecycle): "needs-approval" | "draft" | "ready" {
  if (lifecycle === "pending_approval" || lifecycle === "replied" || lifecycle === "negotiating") return "needs-approval";
  if (lifecycle === "approved") return "ready";
  return "draft";
}

function computeEmailScore(input: { score: number; confidence: number; hasSubject: boolean; hasBody: boolean }) {
  const weighted = Math.round(input.score * 0.6 + input.confidence * 100 * 0.4);
  let total = weighted;
  if (!input.hasSubject) total -= 15;
  if (!input.hasBody) total -= 25;
  return Math.max(0, Math.min(100, total));
}

function computeDraftFlags(lead: {
  score: number;
  confidenceScore: number;
  subject: string;
  body: string;
  lastContactedAt: Date | null;
}) {
  const flags: Array<{ title: string; detail: string; severity: "info" | "warning" | "critical" }> = [];
  if (!lead.subject.trim()) flags.push({ title: "Missing subject", detail: "Draft subject is empty.", severity: "critical" });
  if (lead.body.trim().length < 80) flags.push({ title: "Short body", detail: "Draft body is too short to be persuasive.", severity: "warning" });
  if (lead.score < 60) flags.push({ title: "Low fit score", detail: `Lead score is ${lead.score}.`, severity: "warning" });
  if (lead.confidenceScore < 0.5) flags.push({ title: "Low confidence", detail: "Signal confidence is below 0.50.", severity: "warning" });
  if (lead.lastContactedAt && Date.now() - lead.lastContactedAt.getTime() < 36 * 60 * 60 * 1000) {
    flags.push({ title: "Recent contact", detail: "Lead was contacted recently.", severity: "info" });
  }
  return flags;
}

async function getLatestOutboundMessage(leadId: string) {
  const db = getDb();
  return db.message.findFirst({
    where: { leadId, direction: "outbound" },
    orderBy: { updatedAt: "desc" },
  });
}

async function ensureFreshGmailAccount(userId: string) {
  const db = getDb();
  const account = await db.gmailAccount.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });
  if (!account) return null;
  if (account.accessToken && (!account.expiryDate || account.expiryDate > new Date(Date.now() + 60_000))) {
    return account;
  }
  if (!account.refreshToken) return account;

  const refreshed = await refreshGoogleAccessToken(account.refreshToken);
  return db.gmailAccount.update({
    where: { id: account.id },
    data: {
      accessToken: refreshed.access_token,
      expiryDate: refreshed.expires_in ? new Date(Date.now() + refreshed.expires_in * 1000) : account.expiryDate,
      scope: refreshed.scope || account.scope,
      connectedAt: new Date(),
    },
  });
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
        where: { direction: "outbound" },
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
      { id: "emails-sent", label: "Emails Sent Today", value: String(sentToday), hint: "Live", accent: "secondary" as const },
      { id: "approval-rate", label: "Approval Rate", value: `${approvalRate}%`, hint: "From approvals", accent: "neutral" as const },
    ],
    leads: leads.map((lead) => {
      const latest = lead.messages[0];
      const subject = latest?.subject || "";
      const body = latest?.body || "";
      const score = lead.score || 0;
      const confidenceScore = lead.confidenceScore || 0;
      return {
        id: lead.id,
        name: `${lead.firstName} ${lead.lastName}`,
        title: lead.title || "Unknown",
        company: lead.company,
        score,
        status: toQueueStatus(lead.lifecycle),
        updatedAt: lead.updatedAt.toISOString(),
        subject,
        body,
        signalBreakdown: (lead.signalBreakdown ?? {}) as Record<string, number>,
        confidenceScore,
        emailScore: computeEmailScore({
          score,
          confidence: confidenceScore,
          hasSubject: Boolean(subject.trim()),
          hasBody: Boolean(body.trim()),
        }),
        flags: computeDraftFlags({
          score,
          confidenceScore,
          subject,
          body,
          lastContactedAt: lead.lastContactedAt,
        }),
      };
    }),
  };
}

export async function getLeadDetail(leadId: string) {
  const db = getDb();
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    include: {
      messages: { orderBy: { updatedAt: "desc" }, take: 10 },
      approvals: { orderBy: { createdAt: "desc" }, take: 10 },
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

  const latest = await getLatestOutboundMessage(leadId);
  if (!latest) {
    const message = await db.message.create({
      data: { userId, leadId, subject, body, lifecycle: "saved", direction: "outbound" },
    });
    await db.analyticsEvent.create({ data: { userId, type: "draft_saved", leadId, messageId: message.id } });
    return message;
  }

  const message = await db.message.update({
    where: { id: latest.id },
    data: { subject, body, lifecycle: "edited", metadata: { editedAt: new Date().toISOString() } as Prisma.InputJsonValue },
  });
  await db.analyticsEvent.create({ data: { userId, type: "draft_saved", leadId, messageId: message.id } });
  return message;
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
      metadata: { regenerated: true } as Prisma.InputJsonValue,
    },
  });

  await db.approval.create({ data: { userId, leadId, messageId: message.id, status: "pending" } });
  await db.lead.update({
    where: { id: leadId },
    data: {
      lifecycle: "pending_approval",
      needsAction: true,
      signalBreakdown: draft.signalBreakdown as Prisma.InputJsonValue,
      confidenceScore: draft.confidenceScore,
    },
  });
  await db.analyticsEvent.create({ data: { userId, type: "draft_generated", leadId, messageId: message.id } });
  await db.processingEvent.create({
    data: {
      userId,
      eventType: "lead.created",
      leadId,
      messageId: message.id,
    },
  });
  return message;
}

export async function rejectDraft(leadId: string) {
  const db = getDb();
  const userId = await getDefaultUserId();
  const message = await getLatestOutboundMessage(leadId);
  if (!message) throw new AppError("not_found", 404, "No draft found");

  await db.message.update({ where: { id: message.id }, data: { lifecycle: "rejected" } });
  await db.approval.updateMany({
    where: { messageId: message.id, status: "pending" },
    data: { status: "rejected", reviewedAt: new Date() },
  });
  await db.lead.update({ where: { id: leadId }, data: { lifecycle: "rejected", needsAction: true } });
  await db.analyticsEvent.create({ data: { userId, type: "draft_rejected", leadId, messageId: message.id } });
}

export async function approveDraft(leadId: string) {
  const db = getDb();
  const userId = await getDefaultUserId();
  const message = await getLatestOutboundMessage(leadId);
  if (!message) throw new AppError("not_found", 404, "No draft available");

  await db.message.update({ where: { id: message.id }, data: { lifecycle: "approved" } });
  await db.approval.updateMany({
    where: { messageId: message.id, status: "pending" },
    data: { status: "approved", reviewedAt: new Date() },
  });
  await db.lead.update({ where: { id: leadId }, data: { lifecycle: "approved", needsAction: false } });
  await db.analyticsEvent.create({ data: { userId, type: "draft_approved", leadId, messageId: message.id } });
  await db.processingEvent.create({
    data: {
      userId,
      eventType: "message.approved",
      leadId,
      messageId: message.id,
    },
  });
  return message;
}

export async function sendApprovedMessage(leadId: string) {
  const db = getDb();
  const userId = await getDefaultUserId();
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new AppError("not_found", 404, "Lead not found");

  const message = await getLatestOutboundMessage(leadId);
  if (!message) throw new AppError("not_found", 404, "No draft available");
  if (message.lifecycle !== "approved") {
    throw new AppError("validation_error", 409, "Draft must be approved before sending");
  }

  const account = await ensureFreshGmailAccount(userId);
  const sendResult = await sendGmailMessage(account, lead.email, message.subject, message.body, message.threadId || undefined);

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
      toEmail: lead.email,
    },
  });

  await db.lead.update({
    where: { id: leadId },
    data: { lifecycle: "sent", needsAction: false, lastContactedAt: new Date() },
  });
  await db.analyticsEvent.create({ data: { userId, type: "email_sent", leadId, messageId: updatedMessage.id } });
  await db.processingEvent.create({
    data: {
      userId,
      eventType: "message.sent",
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

export async function approveAndSend(leadId: string) {
  await approveDraft(leadId);
  return sendApprovedMessage(leadId);
}

export async function getPendingApprovals() {
  const db = getDb();
  const userId = await getDefaultUserId();
  return db.approval.findMany({
    where: { userId, status: "pending" },
    include: { lead: true, message: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function leadScoreExplanation(leadId: string) {
  const db = getDb();
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new AppError("not_found", 404, "Lead not found");
  return buildLeadScoreExplanation(lead);
}
