import { KnowledgeChunk } from "@prisma/client";
import { getDb } from "../core/db";
import { getDefaultUserId } from "../core/identity";

export function chunkText(content: string, size = 700) {
  const words = content.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size).join(" "));
  }
  return chunks;
}

export async function ingestKnowledge(category: string, title: string, content: string) {
  const db = getDb();
  const userId = await getDefaultUserId();

  const rule = await db.knowledgeRule.create({
    data: {
      userId,
      category,
      title,
      content,
    },
  });

  const chunks = chunkText(content, 80);
  await db.knowledgeChunk.createMany({
    data: chunks.map((chunk, index) => ({
      knowledgeRuleId: rule.id,
      chunkIndex: index,
      content: chunk,
      tokenCount: chunk.split(/\s+/).length,
    })),
  });

  return rule;
}

function scoreChunk(query: string, chunk: KnowledgeChunk) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const text = chunk.content.toLowerCase();
  const matches = terms.reduce((acc, term) => (text.includes(term) ? acc + 1 : acc), 0);
  return terms.length > 0 ? matches / terms.length : 0;
}

export async function retrieveContext(query: string, extraContext: string[] = []) {
  const db = getDb();
  const userId = await getDefaultUserId();
  const chunks = await db.knowledgeChunk.findMany({
    where: { knowledgeRule: { userId, active: true } },
    include: { knowledgeRule: true },
    take: 500,
  });

  const ranked = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(query, chunk) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const contextParts = ranked.map(
    (item) => `[${item.chunk.knowledgeRule.category}] ${item.chunk.content}`
  );

  return [...extraContext, ...contextParts].join("\n\n");
}
