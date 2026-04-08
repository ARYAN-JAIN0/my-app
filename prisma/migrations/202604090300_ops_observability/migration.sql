-- CreateEnum
CREATE TYPE "public"."JobRunStatus" AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "public"."JobRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" "public"."JobRunStatus" NOT NULL DEFAULT 'queued',
    "stage" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER,
    "processedCount" INTEGER,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionKey" TEXT NOT NULL,
    "component" TEXT,
    "requestPath" TEXT,
    "service" TEXT,
    "leadId" TEXT,
    "messageId" TEXT,
    "importJobId" TEXT,
    "jobRunId" TEXT,
    "status" TEXT NOT NULL,
    "durationMs" INTEGER,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeatureStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "route" TEXT,
    "backendEndpoint" TEXT,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dependencies" JSONB,
    "notes" TEXT,
    "lastSuccessAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "automatedVerified" BOOLEAN NOT NULL DEFAULT false,
    "manualVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeatureStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HealthCheckResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "latencyMs" INTEGER,
    "message" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthCheckResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIProviderSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "baseUrl" TEXT,
    "apiKey" TEXT,
    "model" TEXT,
    "fallbackProvider" TEXT,
    "fallbackModel" TEXT,
    "mode" TEXT DEFAULT 'local-first',
    "temperature" DOUBLE PRECISION DEFAULT 0.3,
    "timeoutMs" INTEGER DEFAULT 30000,
    "retries" INTEGER DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AIProviderSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIConnectionTestResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "latencyMs" INTEGER,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIConnectionTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StressTestRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."JobRunStatus" NOT NULL DEFAULT 'queued',
    "leadCount" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "avgLatencyMs" DOUBLE PRECISION,
    "p95LatencyMs" DOUBLE PRECISION,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "queueDepth" INTEGER,
    "slowestEndpoint" TEXT,
    "notes" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StressTestRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StressTestMetric" (
    "id" TEXT NOT NULL,
    "stressTestRunId" TEXT NOT NULL,
    "jobRunId" TEXT,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StressTestMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobRun_userId_jobType_createdAt_idx" ON "public"."JobRun"("userId", "jobType", "createdAt");
CREATE INDEX "JobRun_status_updatedAt_idx" ON "public"."JobRun"("status", "updatedAt");
CREATE INDEX "ActivityLog_userId_createdAt_idx" ON "public"."ActivityLog"("userId", "createdAt");
CREATE INDEX "ActivityLog_actionKey_createdAt_idx" ON "public"."ActivityLog"("actionKey", "createdAt");
CREATE INDEX "ActivityLog_leadId_idx" ON "public"."ActivityLog"("leadId");
CREATE INDEX "ActivityLog_jobRunId_idx" ON "public"."ActivityLog"("jobRunId");
CREATE UNIQUE INDEX "FeatureStatus_userId_featureKey_key" ON "public"."FeatureStatus"("userId", "featureKey");
CREATE INDEX "FeatureStatus_status_updatedAt_idx" ON "public"."FeatureStatus"("status", "updatedAt");
CREATE INDEX "HealthCheckResult_userId_checkKey_createdAt_idx" ON "public"."HealthCheckResult"("userId", "checkKey", "createdAt");
CREATE INDEX "HealthCheckResult_status_createdAt_idx" ON "public"."HealthCheckResult"("status", "createdAt");
CREATE UNIQUE INDEX "SystemSetting_userId_key_key" ON "public"."SystemSetting"("userId", "key");
CREATE INDEX "SystemSetting_updatedAt_idx" ON "public"."SystemSetting"("updatedAt");
CREATE UNIQUE INDEX "AIProviderSetting_userId_provider_key" ON "public"."AIProviderSetting"("userId", "provider");
CREATE INDEX "AIProviderSetting_enabled_updatedAt_idx" ON "public"."AIProviderSetting"("enabled", "updatedAt");
CREATE INDEX "AIConnectionTestResult_userId_provider_createdAt_idx" ON "public"."AIConnectionTestResult"("userId", "provider", "createdAt");
CREATE INDEX "StressTestRun_userId_createdAt_idx" ON "public"."StressTestRun"("userId", "createdAt");
CREATE INDEX "StressTestRun_status_updatedAt_idx" ON "public"."StressTestRun"("status", "updatedAt");
CREATE INDEX "StressTestMetric_stressTestRunId_createdAt_idx" ON "public"."StressTestMetric"("stressTestRunId", "createdAt");
CREATE INDEX "StressTestMetric_jobRunId_idx" ON "public"."StressTestMetric"("jobRunId");

-- AddForeignKey
ALTER TABLE "public"."JobRun" ADD CONSTRAINT "JobRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."FeatureStatus" ADD CONSTRAINT "FeatureStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."HealthCheckResult" ADD CONSTRAINT "HealthCheckResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."SystemSetting" ADD CONSTRAINT "SystemSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."AIProviderSetting" ADD CONSTRAINT "AIProviderSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."AIConnectionTestResult" ADD CONSTRAINT "AIConnectionTestResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."StressTestRun" ADD CONSTRAINT "StressTestRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."StressTestMetric" ADD CONSTRAINT "StressTestMetric_stressTestRunId_fkey" FOREIGN KEY ("stressTestRunId") REFERENCES "public"."StressTestRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."StressTestMetric" ADD CONSTRAINT "StressTestMetric_jobRunId_fkey" FOREIGN KEY ("jobRunId") REFERENCES "public"."JobRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
