import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  DISCORD_STATE_COOKIE,
  discordAvatarUrl,
  discordConfigured,
  discordUsernameSlug,
  exchangeDiscordCode,
  verifyDiscordState,
} from "@/lib/discord";
import { SESSION_COOKIE, signSession } from "@/lib/session-token";

export const runtime = "nodejs";

function appOrigin(request: NextRequest) {
  return (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, "");
}

export async function GET(request: NextRequest) {
  const origin = appOrigin(request);
  const fail = (code: string) => {
    const response = NextResponse.redirect(`${origin}/connexion?erreur=${code}`);
    response.cookies.delete(DISCORD_STATE_COOKIE);
    return response;
  };

  if (!discordConfigured()) return fail("discord");

  const url = request.nextUrl;
  if (url.searchParams.get("error")) return fail("refuse");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.cookies.get(DISCORD_STATE_COOKIE)?.value;
  if (!code || !state || !cookieState || state !== cookieState || !verifyDiscordState(state)) {
    return fail("etat");
  }

  try {
    const profile = await exchangeDiscordCode(code);
    const db = getDb();
    let account = await db.query.users.findFirst({ where: eq(users.discordId, profile.id) });

    if (!account) {
      const displayName = (profile.global_name || profile.username).slice(0, 80) || "Discord";
      let username = discordUsernameSlug(profile);
      const taken = await db.query.users.findFirst({ where: eq(users.username, username) });
      if (taken) username = `d${profile.id.slice(-10)}`;

      const [created] = await db
        .insert(users)
        .values({
          username,
          displayName,
          passwordHash: null,
          discordId: profile.id,
          discordUsername: profile.username,
          discordAvatar: discordAvatarUrl(profile),
          accessStatus: "pending",
          active: true,
          isSuperAdmin: false,
        })
        .returning();
      account = created;
    } else {
      if (!account.active || account.accessStatus === "denied") return fail("refuse");
      await db
        .update(users)
        .set({
          discordUsername: profile.username,
          discordAvatar: discordAvatarUrl(profile),
          updatedAt: new Date(),
        })
        .where(eq(users.id, account.id));
    }

    const destination = account.accessStatus === "approved" || account.isSuperAdmin ? "/hall" : "/attente";
    const response = NextResponse.redirect(`${origin}${destination}`);
    response.cookies.set(SESSION_COOKIE, await signSession(account.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    response.cookies.delete(DISCORD_STATE_COOKIE);
    return response;
  } catch {
    return fail("discord");
  }
}
