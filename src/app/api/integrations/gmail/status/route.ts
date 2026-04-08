import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { getDb } from "@/server/core/db";
import { getDefaultUserId } from "@/server/core/identity";

export async function GET() {
  try {
    const db = getDb();
    const userId = await getDefaultUserId();
    const account = await db.gmailAccount.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });
    return toSuccessResponse(ok({
      connected: Boolean(account?.accessToken),
      email: account?.email || null,
      connectedAt: account?.connectedAt?.toISOString() || null,
    }));
  } catch (error) {
    return toErrorResponse(error);
  }
}
