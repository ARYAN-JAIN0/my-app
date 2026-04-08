import { Prisma } from "@prisma/client";
import { getDb } from "../core/db";
import { getDefaultUserId } from "../core/identity";
import { AppError } from "../core/http";
import { analyzeReply, generateReplyDraft } from "../services/ai-tasks";
import { needsEscalation } from "../services/lead-scoring";

export async function processInboundReply(params: {
  threadId?: string;
  leadId?: string;
  subject: string;
  body: string;
  fromEmail?: string;
  gmailMessageId?: string;
  gmailThreadId?: string;
}) {
  const db = getDb();
  const userId = await getDefaultUserId();

  let leadId = params.leadId;
  let threadId: string | undefined;

  if (!leadId && params.threadId) {
    const link = await db.threadLead.findFirst({ where: { threadId: params.threadId } });
    leadId = link?.leadId;
    threadId = params.threadId;
  }

  if (!leadId && params.gmailThreadId) {
    const thread = await db.thread.findUnique({ where: { gmailThreadId: params.gmailThreadId } });
    if (thread) {
      const link = await db.threadLead.findFirst({ where: { threadId: thread.id } });
      leadId = link?.leadId;
      threadId = thread.id;
    }
  }

  if (!leadId) {
    throw new AppError("not_found", 404, "Unable to map reply to lead");
  }

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new AppError("not_found", 404, "Lead not found");

  const analysis = await analyzeReply(params.body);

  const inbound = await db.message.create({
    data: {
      userId,
      leadId,
      threadId,
      gmailMessageId: params.gmailMessageId,
      subject: params.subject,
      body: params.body,
      fromEmail: params.fromEmail,
      direction: "inbound",
      lifecycle: "sent",
      replyIntent: analysis.intent,
      aiSummary: analysis.summary,
      metadata: { rationale: analysis.rationale } as Prisma.InputJsonValue,
      sentAt: new Date(),
    },
  });

  const turnCount = await db.message.count({ where: { leadId, direction: "inbound" } });
  const escalate = needsEscalation(analysis.intent, turnCount);

  const replyDraftBody = await generateReplyDraft({
    leadName: `${lead.firstName} ${lead.lastName}`,
    company: lead.company,
    replyText: params.body,
    intent: analysis.intent,
  });

  const replyDraft = await db.message.create({
    data: {
      userId,
      leadId,
      threadId,
      subject: `Re: ${params.subject}`,
      body: replyDraftBody,
      direction: "outbound",
      lifecycle: "pending_approval",
      metadata: {
        generatedFromReply: inbound.id,
        escalationRequired: escalate,
        negotiationTurn: turnCount,
      } as Prisma.InputJsonValue,
    },
  });

  await db.approval.create({
    data: {
      userId,
      leadId,
      messageId: replyDraft.id,
      status: "pending",
    },
  });

  await db.lead.update({
    where: { id: leadId },
    data: {
      lifecycle: analysis.intent === "not_interested" ? "lost" : escalate ? "negotiating" : "replied",
      needsAction: true,
      lastRepliedAt: new Date(),
    },
  });

  await db.followup.updateMany({
    where: { leadId, status: "scheduled" },
    data: { status: "cancelled" },
  });

  await db.analyticsEvent.createMany({
    data: [
      { userId, type: "reply_received", leadId, messageId: inbound.id },
      { userId, type: "reply_classified", leadId, messageId: inbound.id, metadata: { intent: analysis.intent } as Prisma.InputJsonValue },
      { userId, type: "reply_draft_generated", leadId, messageId: replyDraft.id },
    ],
  });
  await db.processingEvent.create({
    data: {
      userId,
      eventType: "reply.received",
      leadId,
      messageId: inbound.id,
      payload: { intent: analysis.intent } as Prisma.InputJsonValue,
    },
  });

  return {
    inbound,
    analysis,
    replyDraft,
    escalationRequired: escalate,
  };
}
