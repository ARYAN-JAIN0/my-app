import { Prisma } from "@prisma/client";
import { getDb } from "../core/db";
import { getDefaultUserId } from "../core/identity";
import { AppError } from "../core/http";
import { generateOutboundDraft } from "../services/ai-tasks";
import { parseLeadFile } from "../services/import-parser";
import { classifyNeedsAction, scoreLead } from "../services/lead-scoring";

export async function startImportJob(filename: string, fileBuffer: Buffer) {
  const db = getDb();
  const userId = await getDefaultUserId();

  const importRows = parseLeadFile(filename, fileBuffer);

  const job = await db.importJob.create({
    data: {
      userId,
      filename,
      status: "processing",
      stage: "storing_data",
      progress: 10,
      totalRows: importRows.length,
    },
  });
  await db.processingEvent.create({
    data: {
      userId,
      eventType: "import.started",
      importJobId: job.id,
      payload: { filename } as Prisma.InputJsonValue,
    },
  });

  let importedRows = 0;
  let duplicateRows = 0;
  let invalidRows = 0;
  let errorRows = 0;

  for (const row of importRows) {
    if (!row.valid) {
      invalidRows += 1;
      await db.importRow.create({
        data: {
          importJobId: job.id,
          rowNumber: row.rowNumber,
          status: "invalid",
          rawData: row.raw as Prisma.InputJsonValue,
          errorReason: row.issues.join("; "),
        },
      });
      await db.processingEvent.create({
        data: {
          userId,
          eventType: "import.row_invalid",
          importJobId: job.id,
          payload: { rowNumber: row.rowNumber, issues: row.issues } as Prisma.InputJsonValue,
        },
      });
      continue;
    }

    const existing = await db.lead.findUnique({
      where: {
        userId_email_company: {
          userId,
          email: row.normalized.email,
          company: row.normalized.company,
        },
      },
    });

    if (existing) {
      duplicateRows += 1;
      await db.importRow.create({
        data: {
          importJobId: job.id,
          rowNumber: row.rowNumber,
          status: "duplicate",
          leadId: existing.id,
          rawData: row.raw as Prisma.InputJsonValue,
          errorReason: "Duplicate by email+company",
        },
      });
      await db.processingEvent.create({
        data: {
          userId,
          eventType: "import.row_duplicate",
          importJobId: job.id,
          leadId: existing.id,
          payload: { rowNumber: row.rowNumber } as Prisma.InputJsonValue,
        },
      });
      continue;
    }

    try {
      const leadScore = scoreLead({
        title: row.normalized.title || null,
        source: row.normalized.source || null,
        company: row.normalized.company,
      });

      const lead = await db.lead.create({
        data: {
          userId,
          firstName: row.normalized.firstName,
          lastName: row.normalized.lastName,
          email: row.normalized.email,
          company: row.normalized.company,
          title: row.normalized.title || null,
          phone: row.normalized.phone || null,
          source: row.normalized.source || "website",
          priority: row.normalized.priority || "medium",
          notes: row.normalized.notes || null,
          lifecycle: "scored",
          score: leadScore.score,
          confidenceScore: leadScore.confidence,
          signalBreakdown: leadScore.signals as Prisma.InputJsonValue,
          needsAction: classifyNeedsAction("scored"),
        },
      });
      await db.processingEvent.create({
        data: {
          userId,
          eventType: "lead.created",
          importJobId: job.id,
          leadId: lead.id,
          payload: { rowNumber: row.rowNumber } as Prisma.InputJsonValue,
        },
      });
      await db.analyticsEvent.create({
        data: {
          userId,
          type: "lead_created",
          leadId: lead.id,
          metadata: { importJobId: job.id, rowNumber: row.rowNumber } as Prisma.InputJsonValue,
        },
      });

      let subject = "Intro from Revo";
      let body = `Hi ${lead.firstName},\n\nWanted to connect with you about growth opportunities at ${lead.company}.\n\nBest,\nRevo`;

      try {
        const aiDraft = await generateOutboundDraft(lead);
        subject = aiDraft.subject;
        body = aiDraft.body;
      } catch {
        // Keep import working even when AI provider is unavailable.
      }

      const message = await db.message.create({
        data: {
          userId,
          leadId: lead.id,
          subject,
          body,
          lifecycle: "pending_approval",
          direction: "outbound",
        },
      });

      await db.approval.create({
        data: {
          userId,
          leadId: lead.id,
          messageId: message.id,
          status: "pending",
        },
      });
      await db.processingEvent.create({
        data: {
          userId,
          eventType: "draft.generated",
          importJobId: job.id,
          leadId: lead.id,
          messageId: message.id,
        },
      });
      await db.analyticsEvent.create({
        data: {
          userId,
          type: "draft_generated",
          leadId: lead.id,
          messageId: message.id,
        },
      });

      await db.lead.update({
        where: { id: lead.id },
        data: {
          lifecycle: "pending_approval",
          needsAction: true,
        },
      });

      await db.importRow.create({
        data: {
          importJobId: job.id,
          rowNumber: row.rowNumber,
          status: "imported",
          leadId: lead.id,
          rawData: row.raw as Prisma.InputJsonValue,
        },
      });

      importedRows += 1;
    } catch (error) {
      errorRows += 1;
      await db.importRow.create({
        data: {
          importJobId: job.id,
          rowNumber: row.rowNumber,
          status: "failed",
          rawData: row.raw as Prisma.InputJsonValue,
          errorReason: error instanceof Error ? error.message : "Row import failed",
        },
      });
      await db.processingEvent.create({
        data: {
          userId,
          eventType: "import.row_failed",
          importJobId: job.id,
          payload: {
            rowNumber: row.rowNumber,
            reason: error instanceof Error ? error.message : "Row import failed",
          } as Prisma.InputJsonValue,
        },
      });
    }

    const processed = importedRows + duplicateRows + invalidRows + errorRows;
    const progress = Math.max(12, Math.min(95, Math.floor((processed / Math.max(importRows.length, 1)) * 100)));
    await db.importJob.update({
      where: { id: job.id },
      data: {
        stage: processed < importRows.length ? "running_rag_analysis" : "generating_ai_drafts",
        progress,
        importedRows,
        duplicateRows,
        invalidRows,
        errorRows,
      },
    });
  }

  await db.importJob.update({
    where: { id: job.id },
    data: {
      status: errorRows > 0 ? "failed" : "completed",
      stage: errorRows > 0 ? "completed_with_errors" : "completed",
      progress: 100,
      completedAt: new Date(),
      importedRows,
      duplicateRows,
      invalidRows,
      errorRows,
      errorMessage: errorRows > 0 ? "Some rows failed during import" : null,
    },
  });
  await db.processingEvent.create({
    data: {
      userId,
      eventType: "import.completed",
      importJobId: job.id,
      payload: {
        importedRows,
        duplicateRows,
        invalidRows,
        errorRows,
      } as Prisma.InputJsonValue,
    },
  });
  await db.analyticsEvent.create({
    data: {
      userId,
      type: "import_completed",
      metadata: {
        importJobId: job.id,
        importedRows,
        duplicateRows,
        invalidRows,
        errorRows,
      } as Prisma.InputJsonValue,
    },
  });

  return job.id;
}

export async function getImportJob(jobId: string) {
  const db = getDb();
  const job = await db.importJob.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new AppError("not_found", 404, "Import job not found");
  }
  return job;
}

export async function getImportJobLogs(jobId: string) {
  const db = getDb();
  return db.importRow.findMany({
    where: { importJobId: jobId },
    orderBy: { rowNumber: "asc" },
  });
}
