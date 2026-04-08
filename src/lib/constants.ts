// Application-wide constants
export const APP_NAME = "Rivo";
export const APP_VERSION = "1.0.0";

// API endpoints
export const API_ENDPOINTS = {
  SDR: "/api/sdr",
  CRM: "/api/crm",
  RAG: "/api/rag",
  NEGOTIATION: "/api/negotiation",
  FINANCE: "/api/finance",
  AUTH: "/api/auth",
} as const;

// Dashboard routes
export const DASHBOARD_ROUTES = {
  SDR: "/sdr",
  CRM: "/crm",
  NEGOTIATION: "/negotiation",
  FINANCE: "/finance",
  RAG: "/rag",
} as const;

// Lead status configuration
export const LEAD_STATUSES = {
  NEW: "new",
  CONTACTED: "contacted",
  QUALIFIED: "qualified",
  UNQUALIFIED: "unqualified",
  CONVERTED: "converted",
} as const;

// Deal stages
export const DEAL_STAGES = {
  PROSPECT: "prospect",
  QUALIFICATION: "qualification",
  PROPOSAL: "proposal",
  NEGOTIATION: "negotiation",
  CLOSED_WON: "closed-won",
  CLOSED_LOST: "closed-lost",
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Feature flags (placeholder for future implementation)
export const FEATURE_FLAGS = {
  AI_EMAIL_GENERATION: true,
  LEAD_SCORING: true,
  PIPELINE_ANALYTICS: true,
  RAG_ENABLED: true,
  NEGOTIATION_BOT: false,
} as const;

