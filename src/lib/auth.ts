import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { getDb } from "./db";
import { users } from "./db/schema";
import { readSession, SESSION_COOKIE, signSession } from "./session-token";

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  title: string | null;
  isSuperAdmin: boolean;
  active: boolean;
  grants: { key: string; level: number }[];
};

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = await readSession(token);
  if (!userId) return null;

  const user = await getDb().query.users.findFirst({
    where: eq(users.id, userId),
    with: { grants: true },
  });
  if (!user?.active) return null;

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    title: user.title,
    isSuperAdmin: user.isSuperAdmin,
    active: user.active,
    grants: user.grants.map((grant) => ({ key: grant.key, level: grant.level })),
  };
});

export async function createSession(userId: string) {
  const token = await signSession(userId);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
