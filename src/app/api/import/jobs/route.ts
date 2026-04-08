import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { getDb } from "@/server/core/db";
import { getDefaultUserId } from "@/server/core/identity";
import { startImportJob } from "@/server/orchestrators/import-orchestrator";

export async function GET() {
  try {
    const db = getDb();
    const userId = await getDefaultUserId();
    const jobs = await db.importJob.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 });
    return toSuccessResponse(ok(jobs));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return toSuccessResponse({ success: false, reason: "validation_error", message: "file is required" }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const jobId = await startImportJob(file.name, buffer);
    return toSuccessResponse(ok({ jobId }), 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}
