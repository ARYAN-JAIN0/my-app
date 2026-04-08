import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { getApprovalAnalytics } from "@/server/orchestrators/analytics-orchestrator";

export async function GET() {
  try {
    const data = await getApprovalAnalytics();
    return toSuccessResponse(ok(data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
