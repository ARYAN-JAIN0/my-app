import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { leadScoreExplanation } from "@/server/orchestrators/workspace-orchestrator";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const explanation = await leadScoreExplanation(id);
    return toSuccessResponse(ok({ explanation }));
  } catch (error) {
    return toErrorResponse(error);
  }
}
