import { appConfig } from "./app.config";

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number;
}

export const featureFlags: FeatureFlag[] = [
  {
    key: "ai_email_generation",
    name: "AI Email Generation",
    description: "Generate personalized emails using AI",
    enabled: appConfig.features.aiEmailGeneration,
  },
  {
    key: "lead_scoring",
    name: "Lead Scoring",
    description: "AI-powered lead qualification and scoring",
    enabled: appConfig.features.leadScoring,
  },
  {
    key: "pipeline_analytics",
    name: "Pipeline Analytics",
    description: "Advanced analytics for sales pipeline",
    enabled: appConfig.features.pipelineAnalytics,
  },
  {
    key: "rag_enabled",
    name: "RAG Integration",
    description: "Retrieval-augmented generation for knowledge base",
    enabled: appConfig.features.ragEnabled,
  },
  {
    key: "negotiation_bot",
    name: "Negotiation Bot",
    description: "AI agent for automated negotiation assistance",
    enabled: appConfig.features.negotiationBot,
    rolloutPercentage: 0,
  },
];

export function isFeatureActive(flagKey: string): boolean {
  const flag = featureFlags.find((f) => f.key === flagKey);
  return flag?.enabled ?? false;
}

export function getActiveFeatures(): FeatureFlag[] {
  return featureFlags.filter((f) => f.enabled);
}
