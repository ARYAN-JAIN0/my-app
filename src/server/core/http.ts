import { NextResponse } from "next/server";
import { ApiEnvelope, fail, FailureReason } from "./api";

export class AppError extends Error {
  readonly reason: FailureReason;
  readonly status: number;
  readonly details?: unknown;

  constructor(reason: FailureReason, status = 400, message?: string, details?: unknown) {
    super(message ?? reason);
    this.reason = reason;
    this.status = status;
    this.details = details;
  }
}

export function toErrorResponse(error: unknown): NextResponse<ApiEnvelope<never>> {
  if (error instanceof AppError) {
    return NextResponse.json(fail(error.reason, error.message, error.details), {
      status: error.status,
    });
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json(fail("unknown_error", message), { status: 500 });
}

export function toSuccessResponse<T>(payload: ApiEnvelope<T>, status = 200) {
  return NextResponse.json(payload, { status });
}
