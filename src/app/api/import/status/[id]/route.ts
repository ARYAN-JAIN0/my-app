import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { getImportJob } from "@/server/orchestrators/import-orchestrator";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const job = await getImportJob(id);
    return toSuccessResponse(ok(job));
  } catch (error) {
    return toErrorResponse(error);
  }
}