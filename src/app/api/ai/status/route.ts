import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";

async function canReach(baseUrl: string) {
  try {
    const url = baseUrl.replace(/\/$/, "");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${url}/models`, { method: "GET", signal: controller.signal });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const localBase = process.env.LOCAL_AI_BASE_URL || process.env.LOCAL_LLM_ENDPOINT || "";
    const openRouterBase = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
    const groqBase = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";

    const [localReachable, openrouterReachable, groqReachable] = await Promise.all([
      localBase ? canReach(localBase) : Promise.resolve(false),
      process.env.OPENROUTER_API_KEY ? canReach(openRouterBase) : Promise.resolve(false),
      process.env.GROQ_API_KEY ? canReach(groqBase) : Promise.resolve(false),
    ]);

    return toSuccessResponse(
      ok({
        providers: {
          local: {
            configured: Boolean(localBase),
            reachable: localReachable,
            model: process.env.LOCAL_AI_MODEL || process.env.LOCAL_MODEL_PRIMARY || null,
          },
          openrouter: {
            configured: Boolean(process.env.OPENROUTER_API_KEY),
            reachable: openrouterReachable,
            model: process.env.OPENROUTER_MODEL || null,
          },
          groq: {
            configured: Boolean(process.env.GROQ_API_KEY),
            reachable: groqReachable,
            model: process.env.GROQ_MODEL || null,
          },
        },
        activeOrder: ["local", "openrouter", "groq"],
      })
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
