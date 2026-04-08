import { NextRequest } from "next/server";
import { z } from "zod";
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
    const schema = z.object({
      firstName: z.string().trim().min(1),
      lastName: z.string().trim().min(1),
      email: z.string().email(),
      company: z.string().trim().min(1),
      title: z.string().optional(),
      phone: z.string().optional(),
      source: z.string().optional(),
      priority: z.string().optional(),
      notes: z.string().optional(),
    });
    const parse = schema.safeParse(await request.json());
    if (!parse.success) {
      return toSuccessResponse(
        { success: false, reason: "validation_error", message: parse.error.issues[0]?.message || "Invalid payload" },
        400
      );
    }

    const lead = await db.lead.create({
      data: {
        userId,
        firstName: parse.data.firstName,
        lastName: parse.data.lastName,
        email: parse.data.email,
        company: parse.data.company,
        title: parse.data.title || null,
        phone: parse.data.phone || null,
        source: parse.data.source || "website",
        priority: parse.data.priority || "medium",
        notes: parse.data.notes || null,
        lifecycle: "imported",
      },
    });

    return toSuccessResponse(ok(lead), 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}
