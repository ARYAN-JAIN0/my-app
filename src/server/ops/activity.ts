import { Prisma } from "@prisma/client";
import { getDb } from "../core/db";
import { getDefaultUserId } from "../core/identity";

interface ActivityInput {
  actionKey: string;
  status: string;
  component?: string;
  requestPath?: string;
  service?: string;
  leadId?: string;
  messageId?: string;
  importJobId?: string;
  jobRunId?: string;
  durationMs?: number;
  details?: Prisma.InputJsonValue;
}

export async function recordActivity(input: ActivityInput) {
  const db = getDb();
  const userId = await getDefaultUserId();

  return db.activityLog.create({
    data: {
      userId,
      actionKey: input.actionKey,
      status: input.status,
      component: input.component || null,
      requestPath: input.requestPath || null,
      service: input.service || null,
      leadId: input.leadId || null,
      messageId: input.messageId || null,
      importJobId: input.importJobId || null,
      jobRunId: input.jobRunId || null,
      durationMs: input.durationMs,
      details: input.details,
    },
  });
}

