import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { deleteKnowledgeDocument } from "@/server/rag/service";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const deleted = await deleteKnowledgeDocument(id);
    if (!deleted) {
      return toSuccessResponse({ success: false, reason: "not_found", message: "Document not found" }, 404);
    }
    return toSuccessResponse(ok({ id, deleted: true }));
  } catch (error) {
    return toErrorResponse(error);
  }
}
