import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { runFollowupScheduler } from "@/server/orchestrators/followup-orchestrator";

export async function POST() {
  try {
    const data = await runFollowupScheduler();
    return toSuccessResponse(ok(data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
