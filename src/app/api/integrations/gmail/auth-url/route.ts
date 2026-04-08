import { randomUUID } from "crypto";
import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { buildOAuthUrl } from "@/server/integrations/gmail";

export async function GET() {
  try {
    const state = randomUUID();
    const url = buildOAuthUrl(state);
    return toSuccessResponse(ok({ url, state }));
  } catch (error) {
    return toErrorResponse(error);
  }
}
