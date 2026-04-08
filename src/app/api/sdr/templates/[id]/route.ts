import { z } from "zod";
import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { deleteTemplate, updateTemplate } from "@/server/orchestrators/template-orchestrator";

const updateSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    subject: z.string().trim().min(1).optional(),
    body: z.string().trim().min(1).optional(),
    active: z.boolean().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field is required",
  });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parse = updateSchema.safeParse(await request.json());
    if (!parse.success) {
      return toSuccessResponse(
        { success: false, reason: "validation_error", message: parse.error.issues[0]?.message || "Invalid payload" },
        400
      );
    }
    const data = await updateTemplate(id, parse.data);
    return toSuccessResponse(ok(data));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await deleteTemplate(id);
    return toSuccessResponse(ok(data));
  } catch (error) {
    return toErrorResponse(error);
  }
}