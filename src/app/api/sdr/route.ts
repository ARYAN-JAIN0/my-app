import { NextRequest } from "next/server";
import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { getDb } from "@/server/core/db";
import { getDefaultUserId } from "@/server/core/identity";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const userId = await getDefaultUserId();
    const search = request.nextUrl.searchParams.get("search") || undefined;
    const status = request.nextUrl.searchParams.get("status") || undefined;
    const priority = request.nextUrl.searchParams.get("priority") || undefined;

    const leads = await db.lead.findMany({
      where: {
        userId,
        ...(status ? { lifecycle: status as never } : {}),
        ...(priority ? { priority } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { company: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });

    const payload = leads.map((lead) => ({
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone || undefined,
      company: lead.company,
      title: lead.title || "",
      status:
        lead.lifecycle === "rejected"
          ? "unqualified"
          : lead.lifecycle === "won"
          ? "converted"
          : lead.lifecycle === "sent" || lead.lifecycle === "replied"
          ? "contacted"
          : "new",
      source: (lead.source as "website" | "linkedin" | "referral" | "cold-outreach" | "conference") || "website",
      priority: (lead.priority as "low" | "medium" | "high" | "urgent") || "medium",
      value: undefined,
      notes: lead.notes || undefined,
      tags: [],
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      lastContactedAt: lead.lastContactedAt?.toISOString(),
    }));

    return toSuccessResponse(ok(payload));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const userId = await getDefaultUserId();
    const body = await request.json();

    if (!body.firstName || !body.lastName || !body.email || !body.company) {
      return toSuccessResponse({ success: false, reason: "validation_error", message: "Missing required fields" }, 400);
    }

    const lead = await db.lead.create({
      data: {
        userId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        company: body.company,
        title: body.title || null,
        phone: body.phone || null,
        source: body.source || "website",
        priority: body.priority || "medium",
        notes: body.notes || null,
        lifecycle: "imported",
      },
    });

    return toSuccessResponse(ok(lead), 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}
