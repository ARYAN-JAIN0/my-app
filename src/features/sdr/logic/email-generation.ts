import type { Lead, EmailTemplate } from "@/features/sdr/types/sdr.types";

interface EmailGenerationOptions {
  template: EmailTemplate;
  lead: Lead;
  customizations?: {
    includePersonalization?: boolean;
    tone?: "formal" | "casual" | "professional";
    includeCallToAction?: boolean;
  };
}

interface GeneratedEmail {
  subject: string;
  body: string;
  variables: string[];
}

export function generateEmail(options: EmailGenerationOptions): GeneratedEmail {
  const { template, lead, customizations } = options;
  const settings = customizations || {
    includePersonalization: true,
    tone: "professional",
    includeCallToAction: true,
  };

  let subject = template.subject;
  let body = template.body;
  const variables: string[] = [];

  // Personalization variables
  const replacements: Record<string, string> = {
    "{{firstName}}": lead.firstName,
    "{{lastName}}": lead.lastName,
    "{{company}}": lead.company,
    "{{title}}": lead.title,
    "{{fullName}}": `${lead.firstName} ${lead.lastName}`,
  };

  if (settings.includePersonalization) {
    Object.entries(replacements).forEach(([key, value]) => {
      if (body.includes(key)) {
        body = body.replace(new RegExp(key, "g"), value);
        variables.push(key);
      }
      if (subject.includes(key)) {
        subject = subject.replace(new RegExp(key, "g"), value);
      }
    });
  }

  // Add tone variations
  if (settings.tone === "casual") {
    body = body.replace("Dear", "Hi");
    body = body.replace("Best regards", "Cheers");
    body = body.replace("Sincerely", "Thanks");
  } else if (settings.tone === "formal") {
    body = body.replace("Hi", "Dear");
  }

  // Add call to action if enabled
  if (settings.includeCallToAction && !body.includes("Schedule a call")) {
    body += "\n\nWould you be open to a quick 15-minute call to discuss how we can help " + lead.company + "?";
  }

  return {
    subject,
    body,
    variables,
  };
}

export const defaultEmailTemplates: EmailTemplate[] = [
  {
    id: "initial-1",
    name: "Initial Outreach - Introduction",
    subject: "Quick question for {{title}} at {{company}}",
    body: `Hi {{firstName}},

I noticed that {{company}} might benefit from our solution. I'd love to share a quick overview.

Would you be open to a brief conversation?

Best regards`,
    type: "initial",
  },
  {
    id: "followup-1",
    name: "Follow Up - No Response",
    subject: "Following up on my previous email",
    body: `Hi {{firstName}},

I wanted to follow up on my earlier email. I understand you're busy, so I'll keep this brief.

Would a 10-minute call work for you this week?

Thanks`,
    type: "followup",
  },
  {
    id: "value-proposition",
    name: "Value Proposition",
    subject: "How {{company}} could benefit from our solution",
    body: `Hi {{firstName}},

I wanted to reach out specifically because I think our solution could help {{company}} achieve [specific goal].

Would you be interested in learning more?

Best regards`,
    type: "custom",
  },
];

export function selectBestTemplate(
  lead: Lead,
  templates: EmailTemplate[]
): EmailTemplate {
  // Select template based on lead status and source
  const suitableTemplates = templates.filter((template) => {
    if (lead.status === "new" && template.type === "initial") return true;
    if (lead.status === "contacted" && template.type === "followup") return true;
    return template.type === "custom";
  });

  return suitableTemplates[0] || templates[0];
}