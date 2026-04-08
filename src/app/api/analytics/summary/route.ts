import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { getAnalyticsSummary } from "@/server/orchestrators/analytics-orchestrator";

export async function GET() {
  try {
    const data = await getAnalyticsSummary();
    return toSuccessResponse(ok(data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
