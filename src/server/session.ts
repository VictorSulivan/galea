"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { clearSession, createSession, getCurrentUser } from "@/lib/auth";
import { actionError, type ActionState } from "@/lib/action";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { normalizeUsername, readText } from "@/lib/format";

export async function login(_state: ActionState, formData: FormData): Promise<ActionState> {
  const username = normalizeUsername(readText(formData, "username", 32));
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Indique ton nom d’utilisateur et ton mot de passe." };

  let destination = "/hall";
  try {
    const user = await getDb().query.users.findFirst({ where: eq(users.username, username) });
    if (!user || !user.active || !user.passwordHash) return { error: "Ce nom d’utilisateur n’ouvre pas la table." };
    if (user.accessStatus === "denied") return { error: "Ce sceau a été refusé." };
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) return { error: "Ce nom d’utilisateur n’ouvre pas la table." };
    await createSession(user.id);
    if (user.accessStatus === "pending" && !user.isSuperAdmin) destination = "/attente";
  } catch (error) {
    return actionError(error);
  }

  redirect(destination);
}

export async function logout() {
  await clearSession();
  redirect("/connexion");
}

export async function updateIdentity(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expirée." };
  const displayName = readText(formData, "displayName", 80);
  const title = readText(formData, "title", 120);
  if (displayName.length < 2) return { error: "Le nom doit contenir au moins deux lettres." };

  try {
    await getDb()
      .update(users)
      .set({ displayName, title: title || null, updatedAt: new Date() })
      .where(eq(users.id, user.id));
  } catch (error) {
    return actionError(error);
  }
  return { ok: "Ton nom a été inscrit." };
}

export async function updatePassword(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expirée." };
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next.length < 8) return { error: "Le nouveau mot de passe doit faire au moins 8 caractères." };
  if (next !== confirm) return { error: "Les deux nouveaux mots de passe diffèrent." };

  try {
    const row = await getDb().query.users.findFirst({ where: eq(users.id, user.id) });
    if (!row?.passwordHash || !(await bcrypt.compare(current, row.passwordHash))) {
      return { error: "Le mot de passe actuel ne correspond pas." };
    }
    await getDb()
      .update(users)
      .set({ passwordHash: await bcrypt.hash(next, 12), updatedAt: new Date() })
      .where(eq(users.id, user.id));
  } catch (error) {
    return actionError(error);
  }
  return { ok: "Mot de passe changé." };
}
