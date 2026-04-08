export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding?: number[];
  metadata: {
    page?: number;
    section?: string;
    wordCount: number;
  };
  createdAt: string;
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  highlights: string[];
}

interface RetrievalConfig {
  maxResults: number;
  similarityThreshold: number;
  rerankEnabled: boolean;
}

const defaultConfig: RetrievalConfig = {
  maxResults: 10,
  similarityThreshold: 0.7,
  rerankEnabled: true,
};

export async function retrieveRelevantDocuments(
  query: string,
  chunks: DocumentChunk[],
  config: Partial<RetrievalConfig> = {}
): Promise<SearchResult[]> {
  const settings = { ...defaultConfig, ...config };
  
  // Calculate cosine similarity (simplified - would use embeddings in production)
  const results: SearchResult[] = chunks.map((chunk) => {
    const score = calculateSimilarity(query, chunk.content);
    const highlights = extractHighlights(chunk.content, query);
    
    return {
      chunk,
      score,
      highlights,
    };
  });
  
  // Sort by score
  results.sort((a, b) => b.score - a.score);
  
  // Filter by threshold
  const filtered = results.filter((r) => r.score >= settings.similarityThreshold);
  
  // Limit results
  return filtered.slice(0, settings.maxResults);
}

function calculateSimilarity(query: string, content: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const contentLower = content.toLowerCase();
  
  let matches = 0;
  queryTerms.forEach((term) => {
    if (contentLower.includes(term)) {
      matches++;
    }
  });
  
  // Simple scoring - in production would use embeddings
  return matches / queryTerms.length;
}

function extractHighlights(content: string, query: string): string[] {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const highlights: string[] = [];
  
  // Find sentences containing query terms
  const sentences = content.split(/[.!?]+/);
  
  sentences.forEach((sentence) => {
    const sentenceLower = sentence.toLowerCase();
    const hasTerm = queryTerms.some((term) => sentenceLower.includes(term));
    
    if (hasTerm && sentence.trim().length > 20) {
      // Highlight matching terms
      let highlighted = sentence.trim();
      queryTerms.forEach((term) => {
        const regex = new RegExp(`(${term})`, "gi");
        highlighted = highlighted.replace(regex, "**$1**");
      });
      highlights.push(highlighted);
    }
  });
  
  return highlights.slice(0, 3);
}

export function formatSearchContext(results: SearchResult[]): string {
  let context = "Relevant information:\n\n";
  
  results.forEach((result, index) => {
    context += `[${index + 1}] ${result.chunk.content}\n`;
    if (result.highlights.length > 0) {
      context += `   Highlights: ${result.highlights.join(" | ")}\n`;
    }
    context += "\n";
  });
  
  return context;
}