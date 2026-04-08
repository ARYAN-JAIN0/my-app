import { AppError } from "../core/http";

interface ProviderConfig {
  name: "local" | "openrouter" | "groq";
  baseUrl: string;
  apiKey?: string;
  model: string;
}

export type AiTaskType =
  | "outbound_draft"
  | "reply_analysis"
  | "reply_generation"
  | "followup_generation"
  | "score_explanation";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function normalizeBaseUrl(url: string) {
  const trimmed = url.replace(/\/$/, "");
  if (trimmed.endsWith("/v1")) return trimmed;
  return `${trimmed}/v1`;
}

function getProviders(): ProviderConfig[] {
  const localBase = process.env.LOCAL_AI_BASE_URL || process.env.LOCAL_LLM_ENDPOINT || "";
  const localModel = process.env.LOCAL_AI_MODEL || process.env.LOCAL_MODEL_PRIMARY || "qwen2.5:7b-instruct";

  const providers: ProviderConfig[] = [
    {
      name: "local",
      baseUrl: localBase ? normalizeBaseUrl(localBase) : "",
      apiKey: process.env.LOCAL_AI_API_KEY,
      model: localModel,
    },
  ];

  const localSecondary = process.env.LOCAL_MODEL_SECONDARY;
  if (localSecondary && localBase) {
    providers.push({
      name: "local",
      baseUrl: normalizeBaseUrl(localBase),
      apiKey: process.env.LOCAL_AI_API_KEY,
      model: localSecondary,
    });
  }

  providers.push(
    {
      name: "openrouter",
      baseUrl: normalizeBaseUrl(process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"),
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || "qwen/qwen2.5-7b-instruct",
    },
    {
      name: "groq",
      baseUrl: normalizeBaseUrl(process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1"),
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    }
  );

  return providers;
}

function taskTemperature(task: AiTaskType) {
  if (task === "reply_analysis") return 0.1;
  if (task === "score_explanation") return 0.2;
  return 0.3;
}

async function callProvider(provider: ProviderConfig, task: AiTaskType, messages: ChatMessage[]) {
  if (!provider.baseUrl) {
    throw new Error(`Provider ${provider.name} has no base URL`);
  }

  const response = await fetch(`${provider.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : {}),
      ...(provider.name === "openrouter" ? { "HTTP-Referer": process.env.APP_URL || "https://revo.local" } : {}),
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: taskTemperature(task),
    }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`${provider.name}/${provider.model} ${response.status}: ${txt}`);
  }

  const json = await response.json();
  return String(json?.choices?.[0]?.message?.content || "").trim();
}

export async function runAiTask(task: AiTaskType, messages: ChatMessage[]) {
  const providers = getProviders();
  const attempts: string[] = [];

  for (const provider of providers) {
    if (provider.name !== "local" && !provider.apiKey) {
      continue;
    }

    try {
      const content = await callProvider(provider, task, messages);
      if (!content) throw new Error("Empty content");
      return {
        provider: provider.name,
        model: provider.model,
        task,
        content,
      };
    } catch (error) {
      attempts.push(error instanceof Error ? error.message : "unknown");
    }
  }

  throw new AppError("missing_ai_provider", 503, "No AI provider could produce a response", {
    task,
    attempts,
  });
}

export async function runJsonTask<T>(task: AiTaskType, messages: ChatMessage[]): Promise<T> {
  const withJsonPrompt: ChatMessage[] = [
    { role: "system", content: "Return only valid JSON. No markdown." },
    ...messages,
  ];
  const result = await runAiTask(task, withJsonPrompt);
  try {
    return JSON.parse(result.content) as T;
  } catch {
    throw new AppError("ai_provider_failed", 502, "AI returned invalid JSON", {
      task,
      provider: result.provider,
      model: result.model,
      payload: result.content,
    });
  }
}
