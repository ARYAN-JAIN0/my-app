import { NextResponse } from "next/server";
import { getDb } from "@/server/core/db";
import { getDefaultUserId } from "@/server/core/identity";

function mapStage(lifecycle: string) {
  if (lifecycle === "approved" || lifecycle === "sent") return "proposal";
  if (lifecycle === "replied" || lifecycle === "negotiating") return "negotiation";
  if (lifecycle === "won") return "closed-won";
  if (lifecycle === "lost" || lifecycle === "rejected") return "closed-lost";
  if (lifecycle === "pending_approval") return "qualification";
  return "prospect";
}

export async function GET() {
  const db = getDb();
  const userId = await getDefaultUserId();
  const leads = await db.lead.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 200 });

  const deals = leads.map((lead) => ({
    id: lead.id,
    name: `${lead.company} - ${lead.firstName} ${lead.lastName}`,
    value: Math.max(2500, (lead.score || 50) * 150),
    stage: mapStage(lead.lifecycle),
    status: lead.lifecycle === "won" ? "won" : lead.lifecycle === "lost" || lead.lifecycle === "rejected" ? "lost" : "active",
    closeDate: lead.updatedAt.toISOString(),
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    contactId: lead.id,
    accountId: lead.company.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  }));

  return NextResponse.json(deals);
}

