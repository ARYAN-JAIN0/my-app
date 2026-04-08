import { GmailAccount } from "@prisma/client";
import { AppError } from "../core/http";

const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "";
  const scopes = process.env.GOOGLE_OAUTH_SCOPES || "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly";

  return { clientId, clientSecret, redirectUri, scopes };
}

export function buildOAuthUrl(state: string) {
  const cfg = getGoogleOAuthConfig();
  if (!cfg.clientId || !cfg.redirectUri) {
    throw new AppError("missing_google_auth", 503, "Google OAuth is not configured");
  }

  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    access_type: "offline",
    scope: cfg.scopes,
    prompt: "consent",
    state,
  });

  return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string) {
  const cfg = getGoogleOAuthConfig();
  if (!cfg.clientId || !cfg.clientSecret || !cfg.redirectUri) {
    throw new AppError("missing_google_auth", 503, "Google OAuth is not configured");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new AppError("missing_google_auth", 502, "Failed to exchange Google code", txt);
  }

  return response.json();
}

export async function sendGmailMessage(account: GmailAccount | null, to: string, subject: string, body: string, threadId?: string) {
  if (!account?.accessToken) {
    throw new AppError("missing_google_auth", 503, "No connected Gmail account");
  }

  const raw = Buffer.from(
    [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      body,
    ].join("\r\n")
  )
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw, threadId }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new AppError("gmail_send_failed", 502, "Gmail send failed", txt);
  }

  return response.json() as Promise<{ id: string; threadId: string }>;
}

export async function listRecentInboxMessages(account: GmailAccount | null) {
  if (!account?.accessToken) {
    throw new AppError("missing_google_auth", 503, "No connected Gmail account");
  }

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=20",
    { headers: { Authorization: `Bearer ${account.accessToken}` } }
  );

  if (!response.ok) {
    const txt = await response.text();
    throw new AppError("gmail_sync_failed", 502, "Failed to list Gmail messages", txt);
  }

  return response.json() as Promise<{ messages?: Array<{ id: string }> }>;
}

export async function getGmailMessage(account: GmailAccount | null, messageId: string) {
  if (!account?.accessToken) {
    throw new AppError("missing_google_auth", 503, "No connected Gmail account");
  }

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${account.accessToken}` } }
  );

  if (!response.ok) {
    const txt = await response.text();
    throw new AppError("gmail_sync_failed", 502, "Failed to fetch Gmail message", txt);
  }

  return response.json();
}
