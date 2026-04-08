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
    data: { userId, category, title, content },
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

  const [profile, offers, chunks, recentMessages, approvedExamples] = await Promise.all([
    db.businessProfile.findUnique({ where: { userId } }),
    db.offer.findMany({ where: { userId, active: true }, orderBy: { updatedAt: "desc" }, take: 5 }),
    db.knowledgeChunk.findMany({
      where: { knowledgeRule: { userId, active: true } },
      include: { knowledgeRule: true },
      take: 500,
    }),
    db.message.findMany({
      where: { userId, direction: "inbound" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { lead: true },
    }),
    db.approval.findMany({
      where: { userId, status: "approved" },
      orderBy: { reviewedAt: "desc" },
      take: 3,
      include: { message: true, lead: true },
    }),
  ]);

  const ranked = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(query, chunk) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const profileContext = profile
    ? [
        `Company: ${profile.companyName}`,
        `Value proposition: ${profile.valueProp}`,
        `Tone rules: ${profile.toneRules}`,
        `Pricing rules: ${profile.pricingRules}`,
        `Objection rules: ${profile.objectionRules}`,
      ].join("\n")
    : "";

  const offersContext = offers
    .map((offer) => `Offer: ${offer.name}${offer.price ? ` (${offer.currency} ${offer.price})` : ""} - ${offer.description}`)
    .join("\n");

  const ruleContext = ranked.map((item) => `[${item.chunk.knowledgeRule.category}] ${item.chunk.content}`).join("\n");
  const recentReplyContext = recentMessages
    .map(
      (message) =>
        `Recent inbound from ${message.lead.firstName} ${message.lead.lastName} (${message.lead.company}): ${message.body.slice(0, 280)}`
    )
    .join("\n");
  const approvedExampleContext = approvedExamples
    .map(
      (approval) =>
        `Approved outbound example for ${approval.lead.company}: subject="${approval.message.subject}" body="${approval.message.body.slice(0, 280)}"`
    )
    .join("\n");

  return [
    ...extraContext,
    profileContext && `Business Profile:\n${profileContext}`,
    offersContext && `Offer Details:\n${offersContext}`,
    ruleContext && `Knowledge Rules:\n${ruleContext}`,
    recentReplyContext && `Previous Messages:\n${recentReplyContext}`,
    approvedExampleContext && `Approved Examples:\n${approvedExampleContext}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function listKnowledgeDocuments() {
  const db = getDb();
  const userId = await getDefaultUserId();
  const docs = await db.knowledgeRule.findMany({
    where: { userId },
    include: {
      _count: {
        select: { chunks: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return docs.map((doc) => ({
    id: doc.id,
    category: doc.category,
    title: doc.title,
    active: doc.active,
    chunkCount: doc._count.chunks,
    updatedAt: doc.updatedAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
  }));
}

export async function deleteKnowledgeDocument(id: string) {
  const db = getDb();
  const userId = await getDefaultUserId();
  const doc = await db.knowledgeRule.findUnique({ where: { id } });
  if (!doc || doc.userId !== userId) {
    return false;
  }
  await db.knowledgeRule.delete({ where: { id } });
  return true;
}

export async function reindexKnowledgeDocuments() {
  const db = getDb();
  const userId = await getDefaultUserId();
  const docs = await db.knowledgeRule.findMany({
    where: { userId, active: true },
    orderBy: { updatedAt: "desc" },
  });

  let chunkCount = 0;
  for (const doc of docs) {
    await db.knowledgeChunk.deleteMany({ where: { knowledgeRuleId: doc.id } });
    const chunks = chunkText(doc.content, 80);
    chunkCount += chunks.length;
    if (chunks.length > 0) {
      await db.knowledgeChunk.createMany({
        data: chunks.map((content, index) => ({
          knowledgeRuleId: doc.id,
          chunkIndex: index,
          content,
          tokenCount: content.split(/\s+/).filter(Boolean).length,
        })),
      });
    }
  }

  return { documents: docs.length, chunks: chunkCount };
}
