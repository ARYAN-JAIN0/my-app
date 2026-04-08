import { getDb } from "../core/db";
import { getDefaultUserId } from "../core/identity";
import { AppError } from "../core/http";

export interface AIProviderSettingPayload {
  provider: string;
  enabled: boolean;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  fallbackProvider?: string;
  fallbackModel?: string;
  mode?: string;
  temperature?: number;
  timeoutMs?: number;
  retries?: number;
}

export async function listAiProviderSettings() {
  const db = getDb();
  const userId = await getDefaultUserId();
  return db.aIProviderSetting.findMany({
    where: { userId },
    orderBy: [{ enabled: "desc" }, { provider: "asc" }],
  });
}

export async function upsertAiProviderSetting(input: AIProviderSettingPayload) {
  const db = getDb();
  const userId = await getDefaultUserId();

  return db.aIProviderSetting.upsert({
    where: { userId_provider: { userId, provider: input.provider } },
    update: {
      enabled: input.enabled,
      baseUrl: input.baseUrl || null,
      apiKey: input.apiKey || null,
      model: input.model || null,
      fallbackProvider: input.fallbackProvider || null,
      fallbackModel: input.fallbackModel || null,
      mode: input.mode || "local-first",
      temperature: input.temperature ?? 0.3,
      timeoutMs: input.timeoutMs ?? 30000,
      retries: input.retries ?? 1,
    },
    create: {
      userId,
      provider: input.provider,
      enabled: input.enabled,
      baseUrl: input.baseUrl || null,
      apiKey: input.apiKey || null,
      model: input.model || null,
      fallbackProvider: input.fallbackProvider || null,
      fallbackModel: input.fallbackModel || null,
      mode: input.mode || "local-first",
      temperature: input.temperature ?? 0.3,
      timeoutMs: input.timeoutMs ?? 30000,
      retries: input.retries ?? 1,
    },
  });
}

export async function getAiProviderSetting(provider: string) {
  const db = getDb();
  const userId = await getDefaultUserId();
  return db.aIProviderSetting.findUnique({ where: { userId_provider: { userId, provider } } });
}

export async function getSystemSetting<T>(key: string, fallback: T): Promise<T> {
  const db = getDb();
  const userId = await getDefaultUserId();
  const setting = await db.systemSetting.findUnique({ where: { userId_key: { userId, key } } });
  return (setting?.value as T | undefined) ?? fallback;
}

export async function setSystemSetting(key: string, value: unknown) {
  const db = getDb();
  const userId = await getDefaultUserId();
  return db.systemSetting.upsert({
    where: { userId_key: { userId, key } },
    update: { value: value as never },
    create: { userId, key, value: value as never },
  });
}

export async function recordAiConnectionTest(input: {
  provider: string;
  success: boolean;
  latencyMs?: number;
  message?: string;
  metadata?: unknown;
}) {
  const db = getDb();
  const userId = await getDefaultUserId();
  return db.aIConnectionTestResult.create({
    data: {
      userId,
      provider: input.provider,
      success: input.success,
      latencyMs: input.latencyMs,
      message: input.message || null,
      metadata: (input.metadata ?? null) as never,
    },
  });
}

export async function requireAiProvider(provider: string) {
  const setting = await getAiProviderSetting(provider);
  if (!setting) {
    throw new AppError("not_found", 404, `AI provider ${provider} is not configured`);
  }
  return setting;
}

