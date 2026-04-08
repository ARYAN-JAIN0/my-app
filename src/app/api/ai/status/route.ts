import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { listAiProviderSettings } from "@/server/ops/settings";

interface StoredProviderSetting {
  provider: string;
  enabled: boolean;
  baseUrl: string | null;
  apiKey: string | null;
  model: string | null;
}

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
    const stored = (await listAiProviderSettings().catch(() => [])) as StoredProviderSetting[];
    const storedMap = new Map(stored.map((item) => [item.provider, item]));
    const localBase = process.env.LOCAL_AI_BASE_URL || process.env.LOCAL_LLM_ENDPOINT || "";
    const openRouterBase = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
    const groqBase = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
    const localBaseUrl = storedMap.get("local")?.baseUrl || localBase;
    const openRouterBaseUrl = storedMap.get("openrouter")?.baseUrl || openRouterBase;
    const groqBaseUrl = storedMap.get("groq")?.baseUrl || groqBase;
    const localModel = storedMap.get("local")?.model || process.env.LOCAL_AI_MODEL || process.env.LOCAL_MODEL_PRIMARY || null;
    const openrouterModel = storedMap.get("openrouter")?.model || process.env.OPENROUTER_MODEL || null;
    const groqModel = storedMap.get("groq")?.model || process.env.GROQ_MODEL || null;

    const [localReachable, openrouterReachable, groqReachable] = await Promise.all([
      localBaseUrl ? canReach(localBaseUrl) : Promise.resolve(false),
      (storedMap.get("openrouter")?.apiKey || process.env.OPENROUTER_API_KEY) ? canReach(openRouterBaseUrl) : Promise.resolve(false),
      (storedMap.get("groq")?.apiKey || process.env.GROQ_API_KEY) ? canReach(groqBaseUrl) : Promise.resolve(false),
    ]);

    return toSuccessResponse(
      ok({
        providers: {
          local: {
            configured: Boolean(localBaseUrl),
            reachable: localReachable,
            model: localModel,
          },
          openrouter: {
            configured: Boolean(storedMap.get("openrouter")?.apiKey || process.env.OPENROUTER_API_KEY),
            reachable: openrouterReachable,
            model: openrouterModel,
          },
          groq: {
            configured: Boolean(storedMap.get("groq")?.apiKey || process.env.GROQ_API_KEY),
            reachable: groqReachable,
            model: groqModel,
          },
        },
        activeOrder: stored.filter((item) => item.enabled).map((item) => item.provider).length > 0
          ? stored.filter((item) => item.enabled).map((item) => item.provider)
          : ["local", "openrouter", "groq"],
      })
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
