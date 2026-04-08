import { NextRequest } from "next/server";
import { ok } from "@/server/core/api";
import { getDb } from "@/server/core/db";
import { getDefaultUserId } from "@/server/core/identity";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";

export async function GET() {
  try {
    const db = getDb();
    const userId = await getDefaultUserId();
    const leads = await db.lead.findMany({
      where: { userId, lifecycle: { in: ["replied", "negotiating"] } },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const payload = leads.map((lead) => ({
      id: lead.id,
      leadName: `${lead.firstName} ${lead.lastName}`,
      company: lead.company,
      stage: lead.lifecycle,
      latestMessage: lead.messages[0]?.body || "",
      score: lead.score || 0,
      updatedAt: lead.updatedAt,
    }));

    return toSuccessResponse(ok(payload));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.leadId || !body.lifecycle) {
      return toSuccessResponse({ success: false, reason: "validation_error", message: "leadId and lifecycle are required" }, 400);
    }

    const db = getDb();
    const lead = await db.lead.update({
      where: { id: body.leadId },
      data: {
        lifecycle: body.lifecycle,
        needsAction: body.lifecycle !== "won" && body.lifecycle !== "lost",
      },
    });

    return toSuccessResponse(ok(lead));
  } catch (error) {
    return toErrorResponse(error);
  }
}
