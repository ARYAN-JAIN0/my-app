import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { listStressRuns } from "@/server/ops/stress";

export async function GET() {
  try {
    const data = await listStressRuns();
    return toSuccessResponse(ok(data));
  } catch (error) {
    return toErrorResponse(error);
  }
}

