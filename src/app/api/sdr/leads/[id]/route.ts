import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { getLeadDetail } from "@/server/orchestrators/workspace-orchestrator";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lead = await getLeadDetail(id);
    return toSuccessResponse(ok(lead));
  } catch (error) {
    return toErrorResponse(error);
  }
}
