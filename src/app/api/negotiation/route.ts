import { z } from "zod";
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
    const bodySchema = z.object({
      leadId: z.string().min(1),
      lifecycle: z.enum(["negotiating", "won", "lost", "replied"]),
    });
    const parse = bodySchema.safeParse(await request.json());
    if (!parse.success) {
      return toSuccessResponse(
        { success: false, reason: "validation_error", message: parse.error.issues[0]?.message || "Invalid payload" },
        400
      );
    }

    const db = getDb();
    const userId = await getDefaultUserId();
    const lead = await db.lead.update({
      where: { id: parse.data.leadId },
      data: {
        lifecycle: parse.data.lifecycle,
        needsAction: parse.data.lifecycle !== "won" && parse.data.lifecycle !== "lost",
      },
    });
    if (parse.data.lifecycle === "won") {
      await db.analyticsEvent.create({
        data: {
          userId,
          type: "lead_converted",
          leadId: lead.id,
        },
      });
    }

    return toSuccessResponse(ok(lead));
  } catch (error) {
    return toErrorResponse(error);
  }
}
