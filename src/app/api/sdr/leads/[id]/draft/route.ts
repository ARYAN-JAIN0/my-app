import { z } from "zod";
import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { regenerateDraft, rejectDraft, saveDraft } from "@/server/orchestrators/workspace-orchestrator";

const payloadSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("save"),
    subject: z.string().trim().min(1),
    body: z.string().trim().min(1),
  }),
  z.object({
    action: z.literal("regenerate"),
  }),
  z.object({
    action: z.literal("reject"),
  }),
]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parseResult = payloadSchema.safeParse(await request.json());
    if (!parseResult.success) {
      return toSuccessResponse(
        { success: false, reason: "validation_error", message: parseResult.error.issues[0]?.message || "Invalid payload" },
        400
      );
    }

    if (parseResult.data.action === "save") {
      const message = await saveDraft(id, parseResult.data.subject, parseResult.data.body);
      return toSuccessResponse(ok(message));
    }

    if (parseResult.data.action === "regenerate") {
      const message = await regenerateDraft(id);
      return toSuccessResponse(ok(message));
    }

    await rejectDraft(id);
    return toSuccessResponse(ok({ leadId: id, status: "rejected" }));
  } catch (error) {
    return toErrorResponse(error);
  }
}
