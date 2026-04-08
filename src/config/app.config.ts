export interface AppConfig {
  appName: string;
  version: string;
  environment: "development" | "staging" | "production";
  apiBaseUrl: string;
  features: FeatureFlags;
}

export interface FeatureFlags {
  aiEmailGeneration: boolean;
  leadScoring: boolean;
  pipelineAnalytics: boolean;
  ragEnabled: boolean;
  negotiationBot: boolean;
}

const isDevelopment = process.env.NODE_ENV === "development";

export const appConfig: AppConfig = {
  appName: "RIVO1",
  version: "1.0.0",
  environment: isDevelopment ? "development" : "production",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "",
  features: {
    aiEmailGeneration: true,
    leadScoring: true,
    pipelineAnalytics: true,
    ragEnabled: true,
    negotiationBot: false,
  },
};

// Environment-specific configurations
export const environments = {
  development: {
    apiBaseUrl: "http://localhost:3000",
    debugMode: true,
    logLevel: "debug" as const,
  },
  staging: {
    apiBaseUrl: "https://staging.rivo1.com",
    debugMode: true,
    logLevel: "info" as const,
  },
  production: {
    apiBaseUrl: "https://api.rivo1.com",
    debugMode: false,
    logLevel: "error" as const,
  },
};

export function getConfig(): AppConfig {
  return appConfig;
}

export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return appConfig.features[feature];
}
