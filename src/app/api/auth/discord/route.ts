import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { DISCORD_STATE_COOKIE, discordAuthorizeUrl, discordConfigured, signDiscordState } from "@/lib/discord";

export const runtime = "nodejs";

export async function GET() {
  if (!discordConfigured()) {
    return NextResponse.redirect(new URL("/connexion?erreur=discord", process.env.APP_URL || "http://localhost:3000"));
  }
  try {
    const state = signDiscordState(randomBytes(16).toString("hex"));
    const response = NextResponse.redirect(discordAuthorizeUrl(state));
    response.cookies.set(DISCORD_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 600,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/connexion?erreur=discord", process.env.APP_URL || "http://localhost:3000"));
  }
}
