import { z } from "zod";
import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { listAiProviderSettings, upsertAiProviderSetting } from "@/server/ops/settings";
import { recordActivity } from "@/server/ops/activity";

const schema = z.object({
  provider: z.enum(["local", "openrouter", "groq"]),
  enabled: z.boolean(),
  baseUrl: z.string().trim().optional(),
  apiKey: z.string().trim().optional(),
  model: z.string().trim().optional(),
  fallbackProvider: z.string().trim().optional(),
  fallbackModel: z.string().trim().optional(),
  mode: z.string().trim().optional(),
  temperature: z.number().min(0).max(2).optional(),
  timeoutMs: z.number().int().min(1000).max(120000).optional(),
  retries: z.number().int().min(0).max(5).optional(),
});

export async function GET() {
  try {
    const data = await listAiProviderSettings();
    return toSuccessResponse(ok(data));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return toSuccessResponse({ success: false, reason: "validation_error", message: parsed.error.issues[0]?.message || "Invalid AI settings payload" }, 400);
    }

    const setting = await upsertAiProviderSetting(parsed.data);
    await recordActivity({ actionKey: "settings.ai.save", status: "success", requestPath: "/api/settings/ai", service: "upsertAiProviderSetting", details: { provider: parsed.data.provider, enabled: parsed.data.enabled } as never });
    return toSuccessResponse(ok(setting));
  } catch (error) {
    return toErrorResponse(error);
  }
}

