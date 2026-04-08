import { getDb } from "../core/db";
import { getDefaultUserId } from "../core/identity";

const TABLES = {
  leads: "lead",
  messages: "message",
  threads: "thread",
  approvals: "approval",
  importJobs: "importJob",
  importRows: "importRow",
  jobRuns: "jobRun",
  activityLogs: "activityLog",
  healthChecks: "healthCheckResult",
  stressTestRuns: "stressTestRun",
  knowledgeRules: "knowledgeRule",
  knowledgeChunks: "knowledgeChunk",
  analyticsEvents: "analyticsEvent",
} as const;

export type ExplorerTable = keyof typeof TABLES;

export async function listExplorerRecords(table: ExplorerTable, search?: string) {
  const db = getDb();
  const userId = await getDefaultUserId();

  switch (table) {
    case "leads":
      return db.lead.findMany({
        where: {
          userId,
          ...(search
            ? {
                OR: [
                  { firstName: { contains: search, mode: "insensitive" } },
                  { lastName: { contains: search, mode: "insensitive" } },
                  { company: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { updatedAt: "desc" },
        take: 100,
      });
    case "messages":
      return db.message.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 });
    case "threads":
      return db.thread.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 100 });
    case "approvals":
      return db.approval.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 });
    case "importJobs":
      return db.importJob.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 });
    case "importRows":
      return db.importRow.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    case "jobRuns":
      return db.jobRun.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 });
    case "activityLogs":
      return db.activityLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 150 });
    case "healthChecks":
      return db.healthCheckResult.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 });
    case "stressTestRuns":
      return db.stressTestRun.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100, include: { metrics: true } });
    case "knowledgeRules":
      return db.knowledgeRule.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 100, include: { chunks: true } });
    case "knowledgeChunks":
      return db.knowledgeChunk.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    case "analyticsEvents":
      return db.analyticsEvent.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 150 });
    default:
      return [];
  }
}

