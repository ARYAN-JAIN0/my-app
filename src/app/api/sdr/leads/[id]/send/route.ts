import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { sendApprovedMessage } from "@/server/orchestrators/workspace-orchestrator";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await sendApprovedMessage(id);
    return toSuccessResponse(ok(result));
  } catch (error) {
    return toErrorResponse(error);
  }
}