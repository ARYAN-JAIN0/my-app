import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { getImportJobLogs } from "@/server/orchestrators/import-orchestrator";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const logs = await getImportJobLogs(id);
    return toSuccessResponse(ok(logs));
  } catch (error) {
    return toErrorResponse(error);
  }
}
