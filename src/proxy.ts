import { NextResponse, type NextRequest } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/session-token";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const signedIn = token ? Boolean(await readSession(token)) : false;
  const isAuthPage = pathname === "/connexion";
  const isWaiting = pathname === "/attente";
  const isDiscordAuth = pathname.startsWith("/api/auth/discord");
  const isPublic =
    isAuthPage ||
    isWaiting ||
    isDiscordAuth ||
    pathname === "/parvis" ||
    pathname.startsWith("/parvis/") ||
    pathname.startsWith("/api/media");

  if (!signedIn && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/parvis" : "/connexion";
    return NextResponse.redirect(url);
  }

  if (signedIn && (isAuthPage || pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/hall";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|webp)$).*)"],
};
