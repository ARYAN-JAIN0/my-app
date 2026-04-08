import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { syncRecentReplies } from "@/server/orchestrators/gmail-sync-orchestrator";

export async function POST() {
  try {
    const result = await syncRecentReplies();
    return toSuccessResponse(ok(result));
  } catch (error) {
    return toErrorResponse(error);
  }
}
