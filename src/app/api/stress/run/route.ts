import { z } from "zod";
import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { runStressTest } from "@/server/ops/stress";

const schema = z.object({
  leadCount: z.union([z.literal(10), z.literal(50), z.literal(100), z.literal(250)]),
  simulateApprovals: z.boolean().optional(),
  simulateReplies: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return toSuccessResponse({ success: false, reason: "validation_error", message: parsed.error.issues[0]?.message || "Invalid stress payload" }, 400);
    }
    const data = await runStressTest(parsed.data);
    return toSuccessResponse(ok(data));
  } catch (error) {
    return toErrorResponse(error);
  }
}

