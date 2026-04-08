import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { regenerateDraft, rejectDraft, saveDraft } from "@/server/orchestrators/workspace-orchestrator";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const action = body.action as "save" | "regenerate" | "reject";

    if (action === "save") {
      if (!body.subject || !body.body) {
        return toSuccessResponse({ success: false, reason: "validation_error", message: "subject and body are required" }, 400);
      }
      const message = await saveDraft(id, body.subject, body.body);
      return toSuccessResponse(ok(message));
    }

    if (action === "regenerate") {
      const message = await regenerateDraft(id);
      return toSuccessResponse(ok(message));
    }

    if (action === "reject") {
      await rejectDraft(id);
      return toSuccessResponse(ok({ leadId: id, status: "rejected" }));
    }

    return toSuccessResponse({ success: false, reason: "validation_error", message: "Unsupported action" }, 400);
  } catch (error) {
    return toErrorResponse(error);
  }
}
