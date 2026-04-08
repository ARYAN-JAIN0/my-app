export type FailureReason =
  | "validation_error"
  | "not_found"
  | "missing_database_url"
  | "database_error"
  | "missing_google_auth"
  | "gmail_send_failed"
  | "gmail_sync_failed"
  | "missing_ai_provider"
  | "ai_provider_failed"
  | "unauthorized"
  | "unknown_error";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  reason: FailureReason;
  message?: string;
  details?: unknown;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

export function fail(
  reason: FailureReason,
  message?: string,
  details?: unknown
): ApiFailure {
  return { success: false, reason, message, details };
}
