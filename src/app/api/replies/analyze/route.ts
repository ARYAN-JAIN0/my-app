import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { processInboundReply } from "@/server/orchestrators/reply-orchestrator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.subject || !body.body) {
      return toSuccessResponse({ success: false, reason: "validation_error", message: "subject and body are required" }, 400);
    }

    const result = await processInboundReply({
      threadId: body.threadId,
      leadId: body.leadId,
      subject: body.subject,
      body: body.body,
      fromEmail: body.fromEmail,
      gmailMessageId: body.gmailMessageId,
      gmailThreadId: body.gmailThreadId,
    });

    return toSuccessResponse(ok(result));
  } catch (error) {
    return toErrorResponse(error);
  }
}
