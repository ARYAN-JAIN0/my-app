import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/server/core/db";

const schema = z.object({
  stage: z.enum(["prospect", "qualification", "proposal", "negotiation", "closed-won", "closed-lost"]),
});

const lifecycleByStage = {
  prospect: "validated",
  qualification: "pending_approval",
  proposal: "approved",
  negotiation: "negotiating",
  "closed-won": "won",
  "closed-lost": "lost",
} as const;

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, reason: "validation_error", message: parsed.error.issues[0]?.message || "Invalid stage" }, { status: 400 });
  }

  const db = getDb();
  const lead = await db.lead.update({
    where: { id },
    data: { lifecycle: lifecycleByStage[parsed.data.stage] },
  });

  return NextResponse.json({ success: true, data: lead });
}

