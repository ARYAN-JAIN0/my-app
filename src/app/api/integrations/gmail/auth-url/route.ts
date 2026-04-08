import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { buildOAuthUrl } from "@/server/integrations/gmail";

export async function GET() {
  try {
    const state = randomUUID();
    const cookieStore = await cookies();
    cookieStore.set("revo_gmail_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60,
      path: "/",
    });
    const url = buildOAuthUrl(state);
    return toSuccessResponse(ok({ url, state }));
  } catch (error) {
    return toErrorResponse(error);
  }
}
