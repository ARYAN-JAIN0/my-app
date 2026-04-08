import { NextRequest } from "next/server";
import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { syncRecentReplies } from "@/server/orchestrators/gmail-sync-orchestrator";

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.GMAIL_WEBHOOK_SECRET;
    const inbound = request.headers.get("x-revo-webhook-secret");
    if (secret && inbound !== secret) {
      return toSuccessResponse({ success: false, reason: "unauthorized", message: "Invalid webhook secret" }, 401);
    }

    const result = await syncRecentReplies();
    return toSuccessResponse(ok(result));
  } catch (error) {
    return toErrorResponse(error);
  }
}
