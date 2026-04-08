import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { regenerateDraft } from "@/server/orchestrators/workspace-orchestrator";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await regenerateDraft(id);
    return toSuccessResponse(ok(result));
  } catch (error) {
    return toErrorResponse(error);
  }
}