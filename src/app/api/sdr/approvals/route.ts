import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { getPendingApprovals } from "@/server/orchestrators/workspace-orchestrator";

export async function GET() {
  try {
    const approvals = await getPendingApprovals();
    return toSuccessResponse(ok(approvals));
  } catch (error) {
    return toErrorResponse(error);
  }
}
