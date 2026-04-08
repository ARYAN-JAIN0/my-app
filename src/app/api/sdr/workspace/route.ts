import { NextRequest } from "next/server";
import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { getWorkspaceData } from "@/server/orchestrators/workspace-orchestrator";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search") || undefined;
    const filter = (request.nextUrl.searchParams.get("filter") as "priority" | "score" | "needs-action" | null) || undefined;
    const data = await getWorkspaceData({ search, filter });
    return toSuccessResponse(ok(data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
