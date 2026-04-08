import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { startImportJob } from "@/server/orchestrators/import-orchestrator";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return toSuccessResponse({ success: false, reason: "validation_error", message: "file is required" }, 400);
    }
    const lower = file.name.toLowerCase();
    if (!(lower.endsWith(".csv") || lower.endsWith(".xlsx") || lower.endsWith(".xls"))) {
      return toSuccessResponse({ success: false, reason: "validation_error", message: "Only CSV/XLSX/XLS files are supported" }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const jobId = await startImportJob(file.name, buffer);
    return toSuccessResponse(ok({ jobId }), 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}