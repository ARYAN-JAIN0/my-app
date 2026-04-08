import { getDb } from "../core/db";
import { getDefaultUserId } from "../core/identity";

export async function runFollowupScheduler() {
  const db = getDb();
  const userId = await getDefaultUserId();
  const now = new Date();

  const due = await db.followup.findMany({
    where: {
      userId,
      status: "scheduled",
      dueAt: { lte: now },
    },
    include: { lead: true },
    orderBy: { dueAt: "asc" },
    take: 100,
  });

  const processed: Array<{ followupId: string; status: string; reason?: string }> = [];

  for (const item of due) {
    if (item.lead.lifecycle === "replied" || item.lead.lifecycle === "negotiating" || item.lead.lifecycle === "won" || item.lead.lifecycle === "lost") {
      await db.followup.update({ where: { id: item.id }, data: { status: "cancelled" } });
      processed.push({ followupId: item.id, status: "cancelled", reason: "lead_replied_or_closed" });
      continue;
    }

    await db.followup.update({ where: { id: item.id }, data: { status: "sent", sentAt: now } });
    processed.push({ followupId: item.id, status: "sent" });
  }

  return { due: due.length, processed };
}
