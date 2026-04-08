import { z } from "zod";
import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { processInboundReply } from "@/server/orchestrators/reply-orchestrator";

const replySchema = z.object({
  threadId: z.string().optional(),
  leadId: z.string().optional(),
  subject: z.string().trim().min(1),
  body: z.string().trim().min(1),
  fromEmail: z.string().optional(),
  gmailMessageId: z.string().optional(),
  gmailThreadId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const parse = replySchema.safeParse(await request.json());
    if (!parse.success) {
      return toSuccessResponse(
        { success: false, reason: "validation_error", message: parse.error.issues[0]?.message || "Invalid payload" },
        400
      );
    }

    const result = await processInboundReply({
      threadId: parse.data.threadId,
      leadId: parse.data.leadId,
      subject: parse.data.subject,
      body: parse.data.body,
      fromEmail: parse.data.fromEmail,
      gmailMessageId: parse.data.gmailMessageId,
      gmailThreadId: parse.data.gmailThreadId,
    });

    return toSuccessResponse(ok(result));
  } catch (error) {
    return toErrorResponse(error);
  }
}
