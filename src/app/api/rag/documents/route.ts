import { z } from "zod";
import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { ingestKnowledge, listKnowledgeDocuments } from "@/server/rag/service";

async function extractTextFromFile(file: File) {
  const filename = file.name.toLowerCase();
  if (filename.endsWith(".txt") || filename.endsWith(".md") || filename.endsWith(".csv") || filename.endsWith(".json")) {
    return file.text();
  }

  if (filename.endsWith(".pdf")) {
    const { PDFParse } = await import("pdf-parse");
    const buf = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buf });
    const result = await parser.getText();
    await parser.destroy();
    return result.text || "";
  }

  throw new Error("Unsupported file type. Upload txt, md, csv, json, or pdf.");
}

export async function GET() {
  try {
    const docs = await listKnowledgeDocuments();
    return toSuccessResponse(ok(docs));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const category = String(form.get("category") || "knowledge");
    const titleInput = String(form.get("title") || "");

    if (!(file instanceof File)) {
      return toSuccessResponse({ success: false, reason: "validation_error", message: "file is required" }, 400);
    }

    const schema = z.object({
      category: z.string().trim().min(1),
      title: z.string().trim().min(1),
      content: z.string().trim().min(1),
    });

    const content = await extractTextFromFile(file);
    const title = titleInput.trim() || file.name;
    const parsed = schema.safeParse({ category, title, content });
    if (!parsed.success) {
      return toSuccessResponse(
        {
          success: false,
          reason: "validation_error",
          message: parsed.error.issues[0]?.message || "Invalid upload payload",
        },
        400
      );
    }

    const doc = await ingestKnowledge(parsed.data.category, parsed.data.title, parsed.data.content);
    return toSuccessResponse(ok(doc), 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}
