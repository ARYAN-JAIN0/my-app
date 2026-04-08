export interface RagDocument {
  id: string;
  title: string;
  type: "pdf" | "doc" | "text" | "markdown";
  content: string;
  chunks: number;
  uploadedAt: string;
}

export interface RagQuery {
  id: string;
  query: string;
  userId: string;
  timestamp: string;
}

export interface RagResponse {
  answer: string;
  sources: {
    documentId: string;
    chunkId: string;
    relevance: number;
  }[];
}
