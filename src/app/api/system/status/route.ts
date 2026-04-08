import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { getLatestHealthSnapshot, runHealthChecks } from "@/server/ops/health";

export async function GET() {
  try {
    const [latest, run] = await Promise.all([getLatestHealthSnapshot(), runHealthChecks()]);
    return toSuccessResponse(ok({ latest, run }));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST() {
  try {
    const data = await runHealthChecks();
    return toSuccessResponse(ok(data));
  } catch (error) {
    return toErrorResponse(error);
  }
}

