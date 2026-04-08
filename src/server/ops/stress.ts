import { Prisma } from "@prisma/client";
import { getDb } from "../core/db";
import { getDefaultUserId } from "../core/identity";
import { generateOutboundDraft } from "../services/ai-tasks";
import { scoreLead } from "../services/lead-scoring";
import { recordActivity } from "./activity";

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index] || 0;
}

export async function runStressTest(input: { leadCount: number; simulateApprovals?: boolean; simulateReplies?: boolean }) {
  const db = getDb();
  const userId = await getDefaultUserId();
  const started = Date.now();

  const run = await db.stressTestRun.create({
    data: {
      userId,
      name: `Rivo ${input.leadCount}-lead stress test`,
      leadCount: input.leadCount,
      mode: "dev-simulated",
      status: "running",
      notes: `simulateApprovals=${Boolean(input.simulateApprovals)} simulateReplies=${Boolean(input.simulateReplies)}`,
    },
  });

  const latencies: number[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (let index = 0; index < input.leadCount; index += 1) {
    const iterationStarted = Date.now();
    try {
      const lead = await db.lead.create({
        data: {
          userId,
          firstName: `Stress${index + 1}`,
          lastName: "Lead",
          email: `stress-${run.id}-${index + 1}@rivo.dev`,
          company: `Load Company ${index + 1}`,
          title: index % 2 === 0 ? "Head of Sales" : "VP Marketing",
          source: index % 3 === 0 ? "linkedin" : "website",
          priority: index % 5 === 0 ? "high" : "medium",
          lifecycle: "validated",
        },
      });

      const score = scoreLead({ title: lead.title || null, source: lead.source || null, company: lead.company });
      await db.lead.update({
        where: { id: lead.id },
        data: {
          lifecycle: "scored",
          score: score.score,
          confidenceScore: score.confidence,
          signalBreakdown: score.signals as Prisma.InputJsonValue,
          needsAction: false,
        },
      });

      let subject = `Quick idea for ${lead.company}`;
      let body = `Hi ${lead.firstName},\n\nI noticed ${lead.company} is growing and thought Rivo could help streamline outbound.\n\nBest,\nRivo`;
      try {
        const draft = await generateOutboundDraft({ ...lead, score: score.score, confidenceScore: score.confidence, signalBreakdown: score.signals } as never);
        subject = draft.subject;
        body = draft.body;
      } catch {
      }

      const message = await db.message.create({
        data: {
          userId,
          leadId: lead.id,
          subject,
          body,
          lifecycle: input.simulateApprovals ? "approved" : "pending_approval",
          direction: "outbound",
        },
      });

      await db.approval.create({
        data: {
          userId,
          leadId: lead.id,
          messageId: message.id,
          status: input.simulateApprovals ? "approved" : "pending",
          reviewedAt: input.simulateApprovals ? new Date() : null,
        },
      });

      if (input.simulateReplies) {
        await db.analyticsEvent.create({ data: { userId, type: "reply_received", leadId: lead.id, messageId: message.id } });
        await db.lead.update({ where: { id: lead.id }, data: { lifecycle: "replied", needsAction: true, lastRepliedAt: new Date() } });
      } else {
        await db.lead.update({ where: { id: lead.id }, data: { lifecycle: input.simulateApprovals ? "approved" : "pending_approval", needsAction: true } });
      }

      successCount += 1;
    } catch {
      failureCount += 1;
    }
    latencies.push(Date.now() - iterationStarted);
  }

  const avgLatencyMs = latencies.length ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : 0;
  const p95LatencyMs = percentile(latencies, 95);
  const slowestEndpoint = "stress:lead-create-score-draft";

  await db.stressTestRun.update({
    where: { id: run.id },
    data: {
      status: failureCount > 0 ? "failed" : "completed",
      successCount,
      failureCount,
      avgLatencyMs,
      p95LatencyMs,
      queueDepth: await db.importJob.count({ where: { userId, status: "processing" } }),
      slowestEndpoint,
      completedAt: new Date(),
    },
  });

  await db.stressTestMetric.createMany({
    data: [
      { stressTestRunId: run.id, name: "total_processed", value: input.leadCount, unit: "count" },
      { stressTestRunId: run.id, name: "success_count", value: successCount, unit: "count" },
      { stressTestRunId: run.id, name: "failure_count", value: failureCount, unit: "count" },
      { stressTestRunId: run.id, name: "avg_latency_ms", value: avgLatencyMs, unit: "ms" },
      { stressTestRunId: run.id, name: "p95_latency_ms", value: p95LatencyMs, unit: "ms" },
      { stressTestRunId: run.id, name: "duration_ms", value: Date.now() - started, unit: "ms" },
    ],
  });

  await recordActivity({
    actionKey: "stress.run",
    status: failureCount > 0 ? "warning" : "success",
    requestPath: "/api/stress/run",
    service: "runStressTest",
    details: { leadCount: input.leadCount, successCount, failureCount, avgLatencyMs, p95LatencyMs } as Prisma.InputJsonValue,
  });

  return db.stressTestRun.findUnique({ where: { id: run.id }, include: { metrics: true } });
}

export async function listStressRuns() {
  const db = getDb();
  const userId = await getDefaultUserId();
  return db.stressTestRun.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 25, include: { metrics: true } });
}

