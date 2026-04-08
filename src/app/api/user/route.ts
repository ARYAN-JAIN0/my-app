import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { getDb } from "@/server/core/db";
import { getDefaultUserId } from "@/server/core/identity";

export async function GET() {
  try {
    const db = getDb();
    const userId = await getDefaultUserId();
    const [user, gmailAccount] = await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, role: true } }),
      db.gmailAccount.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { email: true, connectedAt: true, accessToken: true },
      }),
    ]);

    if (!user) {
      return toSuccessResponse({ success: false, reason: "not_found", message: "User not found" }, 404);
    }

    return toSuccessResponse(
      ok({
        ...user,
        integrations: {
          gmail: {
            connected: Boolean(gmailAccount?.accessToken),
            email: gmailAccount?.email || null,
            connectedAt: gmailAccount?.connectedAt?.toISOString() || null,
          },
        },
      })
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
