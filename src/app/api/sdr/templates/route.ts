import { z } from "zod";
import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { createTemplate, listTemplates } from "@/server/orchestrators/template-orchestrator";

const createSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1).default("outbound"),
  subject: z.string().trim().min(1),
  body: z.string().trim().min(1),
  active: z.boolean().optional(),
});

export async function GET() {
  try {
    const data = await listTemplates();
    return toSuccessResponse(ok(data));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const parse = createSchema.safeParse(await request.json());
    if (!parse.success) {
      return toSuccessResponse(
        { success: false, reason: "validation_error", message: parse.error.issues[0]?.message || "Invalid payload" },
        400
      );
    }
    const data = await createTemplate(parse.data);
    return toSuccessResponse(ok(data), 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}