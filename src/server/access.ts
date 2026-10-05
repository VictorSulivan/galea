"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { actionError, type ActionState } from "@/lib/action";
import { getDb } from "@/lib/db";
import { grants, users } from "@/lib/db/schema";
import { normalizeUsername, readText, validUsername } from "@/lib/format";
import { can, clampLevel, knownGrantKeys } from "@/lib/permissions";

async function guard() {
  const actor = await getCurrentUser();
  if (!actor || !can(actor, "acces.gerer")) return null;
  return actor;
}

function selectedGrants(formData: FormData, slugs: string[]) {
  return knownGrantKeys(slugs.map((slug) => ({ slug, name: slug, sensitivity: "ouvert" as const })))
    .map((key) => ({ key, level: clampLevel(Number(formData.get(key))) }))
    .filter((grant) => grant.level > 0);
}

export async function saveAccess(_state: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await guard();
  if (!actor) return { error: "Tu ne peux pas gérer les accès." };
  const id = readText(formData, "id", 80);
  const displayName = readText(formData, "displayName", 80);
  const title = readText(formData, "title", 120);
  if (displayName.length < 2) return { error: "Le nom doit contenir au moins deux lettres." };

  try {
    const target = await getDb().query.users.findFirst({ where: eq(users.id, id) });
    if (!target) return { error: "Compte introuvable." };
    const shelfRows = await getDb().query.shelves.findMany();
    const chosen = selectedGrants(formData, shelfRows.map((shelf) => shelf.slug));

    await getDb()
      .update(users)
      .set({
        displayName,
        title: title || null,
        active: target.isSuperAdmin ? true : formData.get("active") === "on",
        accessStatus: target.isSuperAdmin
          ? "approved"
          : formData.get("accessStatus") === "denied"
            ? "denied"
            : formData.get("accessStatus") === "pending"
              ? "pending"
              : "approved",
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
    await getDb().delete(grants).where(eq(grants.userId, id));
    if (chosen.length) {
      await getDb().insert(grants).values(chosen.map((grant) => ({ userId: id, key: grant.key, level: grant.level })));
    }
  } catch (error) {
    return actionError(error);
  }

  revalidatePath("/administration");
  revalidatePath("/administration/acces");
  revalidatePath(`/administration/acces/${id}`);
  return { ok: "Droits enregistrés." };
}

export async function createAccount(_state: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await guard();
  if (!actor) return { error: "Tu ne peux pas ouvrir un compte." };
  const username = normalizeUsername(readText(formData, "username", 32));
  const displayName = readText(formData, "displayName", 80);
  const title = readText(formData, "title", 120);
  const password = String(formData.get("password") ?? "");
  if (!validUsername(username)) return { error: "Le nom d’utilisateur fait 3 à 24 signes : lettres, chiffres, tiret." };
  if (displayName.length < 2) return { error: "Le nom doit contenir au moins deux lettres." };
  if (password.length < 8) return { error: "Le mot de passe doit faire au moins 8 caractères." };

  try {
    const existing = await getDb().query.users.findFirst({ where: eq(users.username, username) });
    if (existing) return { error: "Ce nom d’utilisateur est déjà pris." };
    const shelfRows = await getDb().query.shelves.findMany();
    const chosen = selectedGrants(formData, shelfRows.map((shelf) => shelf.slug));
    const [created] = await getDb()
      .insert(users)
      .values({
        username,
        displayName,
        title: title || null,
        passwordHash: await bcrypt.hash(password, 12),
        accessStatus: "approved",
        active: true,
      })
      .returning({ id: users.id });
    if (chosen.length) {
      await getDb().insert(grants).values(chosen.map((grant) => ({ userId: created.id, key: grant.key, level: grant.level })));
    }
    revalidatePath("/administration/acces");
    redirect(`/administration/acces/${created.id}`);
  } catch (error) {
    return actionError(error);
  }
}

export async function resetAccessPassword(_state: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await guard();
  if (!actor) return { error: "Tu ne peux pas changer ce mot de passe." };
  const id = readText(formData, "id", 80);
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Le mot de passe doit faire au moins 8 caractères." };
  try {
    const target = await getDb().query.users.findFirst({ where: eq(users.id, id) });
    if (!target) return { error: "Compte introuvable." };
    await getDb()
      .update(users)
      .set({ passwordHash: await bcrypt.hash(password, 12), updatedAt: new Date() })
      .where(eq(users.id, id));
  } catch (error) {
    return actionError(error);
  }
  return { ok: "Nouveau mot de passe confié." };
}

export async function approveDiscordAccess(_state: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await guard();
  if (!actor) return { error: "Tu ne peux pas ouvrir ce sceau." };
  const id = readText(formData, "id", 80);
  try {
    const target = await getDb().query.users.findFirst({ where: eq(users.id, id) });
    if (!target) return { error: "Compte introuvable." };
    if (target.isSuperAdmin) return { error: "Le gardien technique n’a pas besoin d’être whitelisté." };

    const shelfRows = await getDb().query.shelves.findMany();
    const { presetGrants } = await import("@/lib/permissions");
    const starter = presetGrants(
      "citoyen",
      shelfRows.map((shelf) => ({
        slug: shelf.slug,
        name: shelf.name,
        sensitivity: shelf.sensitivity as "ouvert" | "restreint" | "secret",
      })),
    );

    await getDb()
      .update(users)
      .set({ accessStatus: "approved", active: true, updatedAt: new Date() })
      .where(eq(users.id, id));

    const existing = await getDb().select().from(grants).where(eq(grants.userId, id));
    if (existing.length === 0 && starter.length) {
      await getDb().insert(grants).values(starter.map((grant) => ({ userId: id, key: grant.key, level: grant.level })));
    }
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/administration");
  revalidatePath("/administration/acces");
  redirect(`/administration/acces/${id}`);
}

export async function denyDiscordAccess(_state: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await guard();
  if (!actor) return { error: "Tu ne peux pas refuser ce sceau." };
  const id = readText(formData, "id", 80);
  try {
    const target = await getDb().query.users.findFirst({ where: eq(users.id, id) });
    if (!target) return { error: "Compte introuvable." };
    if (target.isSuperAdmin) return { error: "Le gardien technique ne peut pas être refusé." };
    await getDb()
      .update(users)
      .set({ accessStatus: "denied", active: false, updatedAt: new Date() })
      .where(eq(users.id, id));
    await getDb().delete(grants).where(eq(grants.userId, id));
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/administration");
  revalidatePath("/administration/acces");
  return { ok: "Compte Discord refusé." };
}
