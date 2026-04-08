import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { reindexKnowledgeDocuments } from "@/server/rag/service";

export async function POST() {
  try {
    const result = await reindexKnowledgeDocuments();
    return toSuccessResponse(ok(result));
  } catch (error) {
    return toErrorResponse(error);
  }
}
