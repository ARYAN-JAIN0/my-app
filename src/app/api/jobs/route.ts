import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { getJobsSnapshot } from "@/server/ops/jobs";

export async function GET() {
  try {
    const data = await getJobsSnapshot();
    return toSuccessResponse(ok(data));
  } catch (error) {
    return toErrorResponse(error);
  }
}

