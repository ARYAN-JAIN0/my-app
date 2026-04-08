import { Prisma } from "@prisma/client";
import { hasDatabaseConfig, getDb } from "../core/db";
import { getDefaultUserId } from "../core/identity";
import { getAnalyticsSummary } from "../orchestrators/analytics-orchestrator";
import { listAiProviderSettings, recordAiConnectionTest } from "./settings";
import { recordActivity } from "./activity";

async function timed<T>(fn: () => Promise<T>) {
  const started = Date.now();
  try {
    const value = await fn();
    return { ok: true as const, value, latencyMs: Date.now() - started };
  } catch (error) {
    return { ok: false as const, error, latencyMs: Date.now() - started };
  }
}

type CheckResult =
  | { ok: true; latencyMs: number; value: unknown }
  | { ok: false; latencyMs: number; error: unknown };

function getCheckErrorMessage(result: CheckResult) {
  if (result.ok) return "OK";
  return result.error instanceof Error ? result.error.message : "Check failed";
}

export async function runHealthChecks() {
  const db = getDb();
  const userId = await getDefaultUserId();
  const aiSettings = await listAiProviderSettings();
  const gmail = await db.gmailAccount.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });
  const leadCount = await db.lead.count({ where: { userId } });

  const checks = [
    {
      key: "database_connected",
      description: "Database connected",
      dependencies: ["DATABASE_URL"],
      run: () => timed(() => db.$queryRaw`SELECT 1`),
    },
    {
      key: "seed_data_present",
      description: "Seed data present",
      dependencies: ["User", "Lead", "BusinessProfile"],
      run: async () => ({ ok: leadCount > 0, latencyMs: 1, value: { count: leadCount } }),
    },
    {
      key: "gmail_oauth_configured",
      description: "Gmail OAuth configured",
      dependencies: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"],
      run: async () => ({ ok: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI), latencyMs: 1, value: null }),
    },
    {
      key: "gmail_account_connected",
      description: "Gmail account connected",
      dependencies: ["GmailAccount"],
      run: async () => ({ ok: Boolean(gmail?.accessToken), latencyMs: 1, value: { email: gmail?.email || null } }),
    },
    {
      key: "analytics_query_working",
      description: "Analytics query working",
      dependencies: ["Lead", "AnalyticsEvent"],
      run: () => timed(() => getAnalyticsSummary()),
    },
    {
      key: "rag_retrieval_working",
      description: "RAG retrieval data available",
      dependencies: ["KnowledgeRule", "KnowledgeChunk"],
      run: async () => {
        const count = await db.knowledgeChunk.count();
        return { ok: count > 0, latencyMs: 1, value: { chunks: count } };
      },
    },
  ];

  const providerChecks = aiSettings.length > 0 ? aiSettings : [
    { provider: "local", enabled: true, baseUrl: process.env.LOCAL_AI_BASE_URL || process.env.LOCAL_LLM_ENDPOINT || null, apiKey: process.env.LOCAL_AI_API_KEY || null, model: process.env.LOCAL_AI_MODEL || process.env.LOCAL_MODEL_PRIMARY || null },
    { provider: "openrouter", enabled: Boolean(process.env.OPENROUTER_API_KEY), baseUrl: process.env.OPENROUTER_BASE_URL || null, apiKey: process.env.OPENROUTER_API_KEY || null, model: process.env.OPENROUTER_MODEL || null },
    { provider: "groq", enabled: Boolean(process.env.GROQ_API_KEY), baseUrl: process.env.GROQ_BASE_URL || null, apiKey: process.env.GROQ_API_KEY || null, model: process.env.GROQ_MODEL || null },
  ];

  const results: Array<Record<string, unknown>> = [];

  for (const check of checks) {
    const result = (await check.run()) as CheckResult;
    const status = result.ok ? "passing" : "failing";
    await db.healthCheckResult.create({
      data: {
        userId,
        checkKey: check.key,
        status,
        latencyMs: result.latencyMs,
        message: getCheckErrorMessage(result),
        details: (result.ok ? result.value : null) as Prisma.InputJsonValue,
      },
    });
    await db.featureStatus.upsert({
      where: { userId_featureKey: { userId, featureKey: check.key } },
      update: {
        status,
        description: check.description,
        dependencies: check.dependencies as Prisma.InputJsonValue,
        lastCheckedAt: new Date(),
        lastSuccessAt: result.ok ? new Date() : undefined,
        automatedVerified: result.ok,
        backendEndpoint: null,
        route: "/status",
      },
      create: {
        userId,
        featureKey: check.key,
        status,
        description: check.description,
        dependencies: check.dependencies as Prisma.InputJsonValue,
        lastCheckedAt: new Date(),
        lastSuccessAt: result.ok ? new Date() : null,
        automatedVerified: result.ok,
        route: "/status",
      },
    });
    results.push({ key: check.key, description: check.description, status, latencyMs: result.latencyMs, dependencies: check.dependencies, message: getCheckErrorMessage(result) });
  }

  for (const provider of providerChecks) {
    const configured = Boolean(provider.baseUrl) && (provider.provider === "local" || Boolean(provider.apiKey));
    const status = configured && provider.enabled ? "passing" : configured ? "warning" : "failing";
    const latencyMs = 1;
    await recordAiConnectionTest({ provider: String(provider.provider), success: status === "passing", latencyMs, message: configured ? "Configured" : "Missing credentials or URL", metadata: { model: provider.model || null } });
    await db.featureStatus.upsert({
      where: { userId_featureKey: { userId, featureKey: `ai_${provider.provider}` } },
      update: {
        status,
        description: `${provider.provider} provider health`,
        dependencies: [String(provider.provider)] as never,
        lastCheckedAt: new Date(),
        lastSuccessAt: status === "passing" ? new Date() : undefined,
        automatedVerified: status === "passing",
        backendEndpoint: "/api/settings/ai/test",
        route: "/settings",
      },
      create: {
        userId,
        featureKey: `ai_${provider.provider}`,
        status,
        description: `${provider.provider} provider health`,
        dependencies: [String(provider.provider)] as never,
        lastCheckedAt: new Date(),
        lastSuccessAt: status === "passing" ? new Date() : null,
        automatedVerified: status === "passing",
        backendEndpoint: "/api/settings/ai/test",
        route: "/settings",
      },
    });
    results.push({ key: `ai_${provider.provider}`, description: `${provider.provider} provider health`, status, latencyMs, dependencies: [String(provider.provider)], message: configured ? "Configured" : "Missing credentials or URL" });
  }

  await recordActivity({ actionKey: "health.run", status: "success", requestPath: "/api/system/status", service: "runHealthChecks", details: { total: results.length } as Prisma.InputJsonValue });

  return {
    checkedAt: new Date().toISOString(),
    databaseConfigured: hasDatabaseConfig(),
    features: results,
  };
}

export async function getLatestHealthSnapshot() {
  const db = getDb();
  const userId = await getDefaultUserId();
  const featureStatuses = await db.featureStatus.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  const recentChecks = await db.healthCheckResult.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
  return { featureStatuses, recentChecks };
}

