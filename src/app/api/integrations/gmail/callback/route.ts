import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode } from "@/server/integrations/gmail";
import { getDb } from "@/server/core/db";
import { getDefaultUserId } from "@/server/core/identity";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/sdr?gmail=missing_code", request.url));
  }

  try {
    const token = await exchangeGoogleCode(code);
    const userId = await getDefaultUserId();
    const db = getDb();
    let accountEmail = "connected@gmail.com";

    if (token.access_token) {
      const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        if (profile?.email) {
          accountEmail = profile.email;
        }
      }
    }

    await db.gmailAccount.upsert({
      where: {
        userId_email: {
          userId,
          email: accountEmail,
        },
      },
      update: {
        accessToken: token.access_token,
        refreshToken: token.refresh_token || undefined,
        expiryDate: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : undefined,
        connectedAt: new Date(),
      },
      create: {
        userId,
        email: accountEmail,
        accessToken: token.access_token,
        refreshToken: token.refresh_token || null,
        expiryDate: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
        connectedAt: new Date(),
      },
    });

    return NextResponse.redirect(new URL("/sdr?gmail=connected", request.url));
  } catch {
    return NextResponse.redirect(new URL("/sdr?gmail=failed", request.url));
  }
}
