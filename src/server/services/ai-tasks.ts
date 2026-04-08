import { Lead } from "@prisma/client";
import { runAiTask, runJsonTask } from "../ai/router";
import { retrieveContext } from "../rag/service";

export async function generateOutboundDraft(lead: Lead) {
  const context = await retrieveContext(
    `${lead.firstName} ${lead.lastName} ${lead.company} ${lead.title ?? ""}`,
    [
      `Lead: ${lead.firstName} ${lead.lastName}`,
      `Company: ${lead.company}`,
      `Title: ${lead.title ?? "Unknown"}`,
    ]
  );

  const result = await runJsonTask<{
    subject: string;
    body: string;
    signalBreakdown?: Record<string, number>;
    confidenceScore?: number;
  }>("outbound_draft", [
    {
      role: "system",
      content:
        "You are an SDR assistant. Generate concise outreach email draft. Output keys: subject, body, signalBreakdown, confidenceScore.",
    },
    { role: "user", content: `Context:\n${context}` },
  ]);

  return {
    subject: result.subject,
    body: result.body,
    signalBreakdown: result.signalBreakdown ?? {},
    confidenceScore: result.confidenceScore ?? 0.7,
  };
}

export async function analyzeReply(text: string) {
  return runJsonTask<{
    summary: string;
    intent: "interested" | "not_interested" | "objection" | "pricing" | "meeting" | "unknown";
    rationale: string;
  }>("reply_analysis", [
    {
      role: "system",
      content:
        "Classify reply intent as one of: interested, not_interested, objection, pricing, meeting, unknown. Return summary, intent, rationale.",
    },
    { role: "user", content: text },
  ]);
}

export async function generateReplyDraft(params: {
  leadName: string;
  company: string;
  replyText: string;
  intent: string;
}) {
  const context = await retrieveContext(`${params.leadName} ${params.company} ${params.intent}`, [
    `Lead: ${params.leadName}`,
    `Company: ${params.company}`,
    `Intent: ${params.intent}`,
    `Inbound: ${params.replyText}`,
  ]);

  const result = await runAiTask("reply_generation", [
    {
      role: "system",
      content: "Write a professional outbound reply draft to the inbound message. Keep it concise and actionable.",
    },
    { role: "user", content: context },
  ]);

  return result.content;
}

export async function buildLeadScoreExplanation(lead: Lead) {
  const result = await runAiTask("score_explanation", [
    { role: "system", content: "Return a short explanation for lead score and outreach strategy." },
    {
      role: "user",
      content: JSON.stringify({
        firstName: lead.firstName,
        lastName: lead.lastName,
        company: lead.company,
        title: lead.title,
        source: lead.source,
      }),
    },
  ]);

  return result.content;
}
