export interface EmbeddingConfig {
  model: string;
  dimensions: number;
  normalize: boolean;
}

export interface EmbeddingResult {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
}

const defaultConfig: EmbeddingConfig = {
  model: "text-embedding-3-small",
  dimensions: 1536,
  normalize: true,
};

// Simple hashing function for demo (in production would use actual embeddings)
function simpleHash(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

export function generateEmbedding(
  text: string,
  config: Partial<EmbeddingConfig> = {}
): EmbeddingResult {
  const settings = { ...defaultConfig, ...config };
  
  // Generate a deterministic pseudo-embedding based on text
  const values: number[] = [];
  const seed = simpleHash(text);
  let rng = seed;
  
  for (let i = 0; i < settings.dimensions; i++) {
    // Simple LCG random number generator
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    let value = (rng / 0x7fffffff) * 2 - 1;
    
    if (settings.normalize) {
      value = Math.tanh(value);
    }
    
    values.push(value);
  }
  
  // Normalize if enabled
  if (settings.normalize) {
    const magnitude = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
    values.forEach((v, i) => {
      values[i] = v / magnitude;
    });
  }
  
  return {
    id: `emb_${Date.now()}`,
    values,
    metadata: { text: text.slice(0, 100) },
  };
}

export async function generateBatchEmbeddings(
  texts: string[],
  config: Partial<EmbeddingConfig> = {}
): Promise<EmbeddingResult[]> {
  return texts.map((text) => generateEmbedding(text, config));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same dimensions");
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(-1, Math.min(1, similarity));
}