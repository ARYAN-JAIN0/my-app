import { z } from "zod";
import { NextRequest } from "next/server";
import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { ingestKnowledge, retrieveContext } from "@/server/rag/service";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("query") || "";
    if (!query) {
      return toSuccessResponse(ok({ context: "" }));
    }
    const context = await retrieveContext(query);
    return toSuccessResponse(ok({ context }));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const schema = z.object({
      category: z.string().trim().min(1),
      title: z.string().trim().min(1),
      content: z.string().trim().min(1),
    });
    const parse = schema.safeParse(await request.json());
    if (!parse.success) {
      return toSuccessResponse(
        { success: false, reason: "validation_error", message: parse.error.issues[0]?.message || "Invalid payload" },
        400
      );
    }
    const rule = await ingestKnowledge(parse.data.category, parse.data.title, parse.data.content);
    return toSuccessResponse(ok(rule), 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}
