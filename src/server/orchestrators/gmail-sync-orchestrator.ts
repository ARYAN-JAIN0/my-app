import { getDb } from "../core/db";
import { getDefaultUserId } from "../core/identity";
import { getGmailMessage, listRecentInboxMessages } from "../integrations/gmail";
import { processInboundReply } from "./reply-orchestrator";

function extractHeader(headers: Array<{ name: string; value: string }>, key: string) {
  return headers.find((h) => h.name.toLowerCase() === key.toLowerCase())?.value;
}

function decodeBody(data?: string) {
  if (!data) return "";
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

export async function syncRecentReplies() {
  const db = getDb();
  const userId = await getDefaultUserId();
  const account = await db.gmailAccount.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });

  const listing = await listRecentInboxMessages(account);
  const messages = listing.messages ?? [];

  const imported: string[] = [];
  for (const messageInfo of messages) {
    const exists = await db.message.findUnique({ where: { gmailMessageId: messageInfo.id } });
    if (exists) continue;

    const full = await getGmailMessage(account, messageInfo.id);
    const payload = full.payload || {};
    const headers = payload.headers || [];
    const subject = extractHeader(headers, "Subject") || "Reply";
    const fromEmail = extractHeader(headers, "From") || "";
    const parts = payload.parts || [];

    let body = decodeBody(payload.body?.data);
    if (!body && Array.isArray(parts)) {
      const textPart = parts.find((p: { mimeType?: string }) => p.mimeType === "text/plain");
      body = decodeBody(textPart?.body?.data);
    }

    try {
      await processInboundReply({
        gmailMessageId: full.id,
        gmailThreadId: full.threadId,
        subject,
        body,
        fromEmail,
      });
      imported.push(full.id);
    } catch {
      // Skip unlinked messages.
    }
  }

  return { synced: imported.length, messageIds: imported };
}
