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
    const body = await request.json();
    if (!body.category || !body.title || !body.content) {
      return toSuccessResponse({ success: false, reason: "validation_error", message: "category, title and content are required" }, 400);
    }
    const rule = await ingestKnowledge(body.category, body.title, body.content);
    return toSuccessResponse(ok(rule), 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}
