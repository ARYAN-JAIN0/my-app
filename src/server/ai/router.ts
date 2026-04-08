import { AppError } from "../core/http";

interface ProviderConfig {
  name: "local" | "openrouter" | "groq";
  baseUrl: string;
  apiKey?: string;
  model: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function getProviders(): ProviderConfig[] {
  return [
    {
      name: "local",
      baseUrl: process.env.LOCAL_AI_BASE_URL || "",
      apiKey: process.env.LOCAL_AI_API_KEY,
      model: process.env.LOCAL_AI_MODEL || "qwen2.5:7b-instruct",
    },
    {
      name: "openrouter",
      baseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || "qwen/qwen2.5-7b-instruct",
    },
    {
      name: "groq",
      baseUrl: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    },
  ];
}

async function callProvider(provider: ProviderConfig, messages: ChatMessage[]) {
  if (!provider.baseUrl) {
    throw new Error(`Provider ${provider.name} has no base URL`);
  }

  const response = await fetch(`${provider.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : {}),
      ...(provider.name === "openrouter" ? { "HTTP-Referer": "https://revo.local" } : {}),
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`${provider.name} ${response.status}: ${txt}`);
  }

  const json = await response.json();
  return String(json?.choices?.[0]?.message?.content || "").trim();
}

export async function runAiTask(messages: ChatMessage[]) {
  const providers = getProviders();
  const attempts: string[] = [];

  for (const provider of providers) {
    if (provider.name !== "local" && !provider.apiKey) {
      continue;
    }
    try {
      const content = await callProvider(provider, messages);
      if (!content) {
        throw new Error("Empty content");
      }
      return { provider: provider.name, content };
    } catch (error) {
      attempts.push(error instanceof Error ? error.message : "unknown");
    }
  }

  throw new AppError(
    "missing_ai_provider",
    503,
    "No AI provider could produce a response",
    attempts
  );
}

export async function runJsonTask<T>(messages: ChatMessage[]): Promise<T> {
  const withJsonPrompt: ChatMessage[] = [
    { role: "system", content: "Return only valid JSON. No markdown." },
    ...messages,
  ];
  const result = await runAiTask(withJsonPrompt);
  try {
    return JSON.parse(result.content) as T;
  } catch {
    throw new AppError("ai_provider_failed", 502, "AI returned invalid JSON", result.content);
  }
}
