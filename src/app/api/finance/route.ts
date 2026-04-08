import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { getDb } from "@/server/core/db";
import { getDefaultUserId } from "@/server/core/identity";

export async function GET() {
  try {
    const db = getDb();
    const userId = await getDefaultUserId();
    const [sentMessages, pendingFollowups, approvals, replied] = await Promise.all([
      db.message.count({ where: { userId, lifecycle: "sent" } }),
      db.followup.count({ where: { userId, status: "scheduled" } }),
      db.approval.count({ where: { userId, status: "approved" } }),
      db.lead.count({ where: { userId, lifecycle: { in: ["replied", "negotiating", "won"] } } }),
    ]);

    const recentReminders = await db.followup.findMany({
      where: { userId },
      orderBy: { dueAt: "asc" },
      take: 20,
      include: { lead: true },
    });

    return toSuccessResponse(ok({
      sentMessages,
      pendingFollowups,
      approvedMessages: approvals,
      activeReplyThreads: replied,
      reminders: recentReminders.map((item) => ({
        id: item.id,
        dueAt: item.dueAt.toISOString(),
        status: item.status,
        leadName: `${item.lead.firstName} ${item.lead.lastName}`,
        company: item.lead.company,
        dayOffset: item.dayOffset,
      })),
    }));
  } catch (error) {
    return toErrorResponse(error);
  }
}

