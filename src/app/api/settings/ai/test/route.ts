import { z } from "zod";
import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { runAiTask } from "@/server/ai/router";
import { recordAiConnectionTest } from "@/server/ops/settings";
import { recordActivity } from "@/server/ops/activity";

const schema = z.object({
  provider: z.enum(["local", "openrouter", "groq"]),
  prompt: z.string().trim().min(1).default("Return a one-line connectivity acknowledgement for Rivo."),
});

export async function POST(request: Request) {
  const started = Date.now();
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return toSuccessResponse({ success: false, reason: "validation_error", message: parsed.error.issues[0]?.message || "Invalid AI test payload" }, 400);
    }

    const result = await runAiTask("outbound_draft", [
      { role: "system", content: `Use provider preference ${parsed.data.provider}. Reply in one sentence.` },
      { role: "user", content: parsed.data.prompt },
    ], parsed.data.provider);

    const latencyMs = Date.now() - started;
    await recordAiConnectionTest({ provider: parsed.data.provider, success: true, latencyMs, message: "AI test completed", metadata: { model: result.model } });
    await recordActivity({ actionKey: "settings.ai.test", status: "success", requestPath: "/api/settings/ai/test", service: "runAiTask", durationMs: latencyMs, details: { provider: parsed.data.provider, model: result.model } as never });
    return toSuccessResponse(ok({ latencyMs, provider: result.provider, model: result.model, content: result.content }));
  } catch (error) {
    const latencyMs = Date.now() - started;
    await recordActivity({ actionKey: "settings.ai.test", status: "failed", requestPath: "/api/settings/ai/test", service: "runAiTask", durationMs: latencyMs, details: { error: error instanceof Error ? error.message : "unknown" } as never });
    return toErrorResponse(error);
  }
}

