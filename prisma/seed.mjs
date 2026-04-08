import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function addDays(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
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
    update: {},
    create: {
      userId: user.id,
      companyName: "Revo Labs",
      valueProp: "AI SDR assistant for high-conversion outbound",
      toneRules: "Confident, concise, never overpromise",
      pricingRules: "Never commit discounts beyond policy",
      objectionRules: "Address concerns with proof and clear next step",
    },
  });

  await prisma.offer.createMany({
    data: [
      { userId: user.id, name: "Outbound Automation", description: "Automated outreach + approvals", price: 1200, currency: "USD" },
      { userId: user.id, name: "Reply Intelligence", description: "Intent classification + response drafts", price: 1800, currency: "USD" },
    ],
    skipDuplicates: true,
  });

  const sampleLeads = [
    ["Sarah", "Jenkins", "sarah.jenkins@veridian.ai", "Veridian AI", "VP Marketing", "linkedin", "high"],
    ["Michael", "Chen", "michael.chen@techflow.com", "TechFlow", "Head of Sales", "referral", "urgent"],
    ["Elena", "Rodriguez", "elena@datanexus.com", "DataNexus", "CTO", "website", "medium"],
  ];

  for (const [firstName, lastName, leadEmail, company, title, source, priority] of sampleLeads) {
    const lead = await prisma.lead.upsert({
      where: {
        userId_email_company: {
          userId: user.id,
          email: leadEmail,
          company,
        },
      },
      update: {},
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

    const message = await prisma.message.create({
      data: {
        userId: user.id,
        leadId: lead.id,
        subject: `Quick note for ${company}`,
        body: `Hi ${firstName},\n\nI wanted to share a short idea on improving outbound conversion at ${company}.\n\nBest,\nRevo`,
        lifecycle: "pending_approval",
        direction: "outbound",
      },
    });

    await prisma.approval.create({
      data: {
        userId: user.id,
        leadId: lead.id,
        messageId: message.id,
        status: "pending",
      },
    });

    for (const day of [2, 5, 10]) {
      await prisma.followup.upsert({
        where: { leadId_dayOffset: { leadId: lead.id, dayOffset: day } },
        update: {},
        create: {
          userId: user.id,
          leadId: lead.id,
          dayOffset: day,
          dueAt: addDays(day),
          status: "scheduled",
        },
      });
    }

    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        type: "lead_seeded",
        leadId: lead.id,
      },
    });
  }

  const ruleData = [
    ["business_context", "Company Context", "Revo targets B2B SaaS teams with outbound pain points."],
    ["tone_rules", "Tone Policy", "Keep language professional, concrete, and respectful."],
    ["pricing_rules", "Pricing Guardrails", "Avoid fixed discount promises without approval."],
    ["objection_handling", "Objection Playbook", "Acknowledge concern, provide evidence, ask next-step question."],
  ];

  for (const [category, title, content] of ruleData) {
    const rule = await prisma.knowledgeRule.create({
      data: {
        userId: user.id,
        category,
        title,
        content,
      },
    });

    await prisma.knowledgeChunk.create({
      data: {
        knowledgeRuleId: rule.id,
        chunkIndex: 0,
        content,
        tokenCount: content.split(/\s+/).length,
      },
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
