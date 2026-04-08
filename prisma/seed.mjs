import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function addDays(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function ensureDraftForLead(userId, lead, subject, body) {
  const existing = await prisma.message.findFirst({
    where: { userId, leadId: lead.id, direction: "outbound", lifecycle: "pending_approval" },
    orderBy: { createdAt: "desc" },
  });

  if (existing) return existing;

  return prisma.message.create({
    data: {
      userId,
      leadId: lead.id,
      subject,
      body,
      lifecycle: "pending_approval",
      direction: "outbound",
    },
  });
}

async function main() {
  const email = process.env.DEFAULT_USER_EMAIL || "owner@revo.local";
  const name = process.env.DEFAULT_USER_NAME || "Revo Owner";

  const user = await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
  });

  await prisma.businessProfile.upsert({
    where: { userId: user.id },
    update: {
      companyName: "Revo Labs",
      valueProp: "AI SDR assistant for high-conversion outbound",
      toneRules: "Confident, concise, never overpromise",
      pricingRules: "Never commit discounts beyond policy",
      objectionRules: "Address concerns with proof and clear next step",
    },
    create: {
      userId: user.id,
      companyName: "Revo Labs",
      valueProp: "AI SDR assistant for high-conversion outbound",
      toneRules: "Confident, concise, never overpromise",
      pricingRules: "Never commit discounts beyond policy",
      objectionRules: "Address concerns with proof and clear next step",
    },
  });

  const offerSeeds = [
    { name: "Outbound Automation", description: "Automated outreach + approvals", price: 1200, currency: "USD" },
    { name: "Reply Intelligence", description: "Intent classification + response drafts", price: 1800, currency: "USD" },
  ];

  for (const offer of offerSeeds) {
    const existing = await prisma.offer.findFirst({ where: { userId: user.id, name: offer.name } });
    if (!existing) {
      await prisma.offer.create({ data: { userId: user.id, active: true, ...offer } });
    }
  }

  const sampleLeads = [
    ["Sarah", "Jenkins", "sarah.jenkins@veridian.ai", "Veridian AI", "VP Marketing", "linkedin", "high"],
    ["Michael", "Chen", "michael.chen@techflow.com", "TechFlow", "Head of Sales", "referral", "urgent"],
    ["Elena", "Rodriguez", "elena@datanexus.com", "DataNexus", "CTO", "website", "medium"],
  ];

  for (const [firstName, lastName, leadEmail, company, title, source, priority] of sampleLeads) {
    const lead = await prisma.lead.upsert({
      where: { userId_email_company: { userId: user.id, email: leadEmail, company } },
      update: {
        firstName,
        lastName,
        title,
        source,
        priority,
        score: 82,
        confidenceScore: 0.82,
        signalBreakdown: { icpFit: 0.8, relevance: 0.75, intent: 0.7 },
        lifecycle: "pending_approval",
        needsAction: true,
      },
      create: {
        userId: user.id,
        firstName,
        lastName,
        email: leadEmail,
        company,
        title,
        source,
        priority,
        score: 82,
        confidenceScore: 0.82,
        signalBreakdown: { icpFit: 0.8, relevance: 0.75, intent: 0.7 },
        lifecycle: "pending_approval",
        needsAction: true,
      },
    });

    const message = await ensureDraftForLead(
      user.id,
      lead,
      `Quick note for ${company}`,
      `Hi ${firstName},\n\nI wanted to share a short idea on improving outbound conversion at ${company}.\n\nBest,\nRevo`
    );

    const approval = await prisma.approval.findFirst({
      where: { userId: user.id, leadId: lead.id, messageId: message.id, status: "pending" },
    });
    if (!approval) {
      await prisma.approval.create({
        data: { userId: user.id, leadId: lead.id, messageId: message.id, status: "pending" },
      });
    }

    for (const day of [2, 5, 10]) {
      await prisma.followup.upsert({
        where: { leadId_dayOffset: { leadId: lead.id, dayOffset: day } },
        update: { status: "scheduled", dueAt: addDays(day) },
        create: {
          userId: user.id,
          leadId: lead.id,
          dayOffset: day,
          dueAt: addDays(day),
          status: "scheduled",
        },
      });
    }

    const existingSeedEvent = await prisma.analyticsEvent.findFirst({
      where: { userId: user.id, type: "lead_seeded", leadId: lead.id },
    });
    if (!existingSeedEvent) {
      await prisma.analyticsEvent.create({ data: { userId: user.id, type: "lead_seeded", leadId: lead.id } });
    }
  }

  const ruleData = [
    ["business_context", "Company Context", "Revo targets B2B SaaS teams with outbound pain points."],
    ["tone_rules", "Tone Policy", "Keep language professional, concrete, and respectful."],
    ["pricing_rules", "Pricing Guardrails", "Avoid fixed discount promises without approval."],
    ["objection_handling", "Objection Playbook", "Acknowledge concern, provide evidence, ask next-step question."],
  ];

  for (const [category, title, content] of ruleData) {
    const existingRule = await prisma.knowledgeRule.findFirst({
      where: { userId: user.id, category, title },
    });

    const rule = existingRule
      ? await prisma.knowledgeRule.update({
          where: { id: existingRule.id },
          data: { content, active: true },
        })
      : await prisma.knowledgeRule.create({
          data: { userId: user.id, category, title, content },
        });

    await prisma.knowledgeChunk.upsert({
      where: { knowledgeRuleId_chunkIndex: { knowledgeRuleId: rule.id, chunkIndex: 0 } },
      update: { content, tokenCount: content.split(/\s+/).length },
      create: {
        knowledgeRuleId: rule.id,
        chunkIndex: 0,
        content,
        tokenCount: content.split(/\s+/).length,
      },
    });
  }

  const templateSeeds = [
    {
      name: "Enterprise Intro",
      category: "outbound",
      subject: "Quick idea for {{company}}",
      body: "Hi {{firstName}},\n\nI noticed {{company}} is scaling outbound. We help teams increase reply rates without adding headcount.\n\nOpen to a quick 15-min chat next week?\n\nBest,\n{{senderName}}",
    },
    {
      name: "Follow-up Sequence",
      category: "followup",
      subject: "Re: improving outbound conversion",
      body: "Hi {{firstName}},\n\nFollowing up in case this slipped through. Happy to share a short teardown of your current outbound messaging.\n\nWould Tuesday or Wednesday work?\n\nBest,\n{{senderName}}",
    },
    {
      name: "High Intent Reply",
      category: "reply",
      subject: "Re: next steps for {{company}}",
      body: "Hi {{firstName}},\n\nGreat question. Based on what you shared, I recommend starting with a focused pilot for your outbound team.\n\nI can share a concrete rollout plan on a short call.\n\nBest,\n{{senderName}}",
    },
  ];

  for (const template of templateSeeds) {
    await prisma.emailTemplate.upsert({
      where: { userId_name: { userId: user.id, name: template.name } },
      update: { ...template, active: true },
      create: { userId: user.id, ...template, active: true },
    });
  }

  console.log("Seed completed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
