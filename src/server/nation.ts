"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { actionError, type ActionState } from "@/lib/action";
import { getDb } from "@/lib/db";
import { citizens, decrees, offices, parchments, users } from "@/lib/db/schema";
import { readDay, readText } from "@/lib/format";
import { can, canVoice } from "@/lib/permissions";
import { safeObjectKey } from "@/lib/storage";

const CITIZEN_STATUSES = ["actif", "en_mission", "absent", "exile", "tombe"];

export async function saveCitizen(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !can(user, "recensement.ecrire")) return { error: "Tu ne peux pas tenir le recensement." };

  const id = readText(formData, "id", 80);
  const name = readText(formData, "name", 120);
  const epithet = readText(formData, "epithet", 120);
  const grade = readText(formData, "grade", 80);
  const status = readText(formData, "status", 20);
  const notes = readText(formData, "notes", 8000);
  const userId = readText(formData, "userId", 80);
  const portrait = readText(formData, "portraitKey", 200);

  if (name.length < 2) return { error: "Le membre a besoin d'un nom." };
  if (!CITIZEN_STATUSES.includes(status)) return { error: "Statut inconnu." };

  const values = {
    name,
    epithet,
    grade,
    status,
    notes,
    joinedOn: readDay(formData, "joinedOn"),
    userId: userId || null,
    portraitKey: portrait ? safeObjectKey(portrait) : null,
    updatedAt: new Date(),
  };

  try {
    if (values.userId) {
      const account = await getDb().query.users.findFirst({ where: eq(users.id, values.userId) });
      if (!account) return { error: "Ce compte n'existe pas." };
      const taken = await getDb().query.citizens.findFirst({ where: eq(citizens.userId, values.userId) });
      if (taken && taken.id !== id) return { error: "Ce compte est déjà lié à un autre membre." };
    }

    if (id) {
      await getDb().update(citizens).set(values).where(eq(citizens.id, id));
    } else {
      await getDb().insert(citizens).values(values);
    }
  } catch (error) {
    return actionError(error);
  }

  revalidatePath("/recensement");
  revalidatePath("/organigramme");
  redirect("/recensement");
}

export async function deleteCitizen(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !can(user, "recensement.ecrire")) return { error: "Tu ne peux pas retirer ce membre." };
  const id = readText(formData, "id", 80);
  try {
    await getDb().delete(citizens).where(eq(citizens.id, id));
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/recensement");
  revalidatePath("/organigramme");
  redirect("/recensement");
}

function descendantIds(rows: { id: string; parentId: string | null }[], id: string): Set<string> {
  const children = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.parentId) continue;
    const list = children.get(row.parentId) ?? [];
    list.push(row.id);
    children.set(row.parentId, list);
  }
  const seen = new Set<string>();
  const stack = [...(children.get(id) ?? [])];
  while (stack.length) {
    const current = stack.pop()!;
    if (seen.has(current)) continue;
    seen.add(current);
    stack.push(...(children.get(current) ?? []));
  }
  return seen;
}

export async function saveOffice(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !can(user, "organigramme.ecrire")) return { error: "Tu ne peux pas dresser l'organigramme." };

  const id = readText(formData, "id", 80);
  const title = readText(formData, "title", 120);
  const summary = readText(formData, "summary", 500);
  const parentId = readText(formData, "parentId", 80) || null;
  const citizenId = readText(formData, "citizenId", 80) || null;
  const sortOrder = Number(readText(formData, "sortOrder", 6) || "0");
  if (title.length < 2) return { error: "L'office a besoin d'un titre." };

  try {
    const rows = await getDb().select({ id: offices.id, parentId: offices.parentId }).from(offices);
    if (id && parentId) {
      if (parentId === id || descendantIds(rows, id).has(parentId)) {
        return { error: "Un office ne peut pas descendre de lui-même." };
      }
    }
    if (parentId && !rows.some((row) => row.id === parentId)) return { error: "L'office parent est introuvable." };
    if (citizenId) {
      const citizen = await getDb().query.citizens.findFirst({ where: eq(citizens.id, citizenId) });
      if (!citizen) return { error: "Ce membre n'est pas au recensement." };
    }

    const values = {
      title,
      summary,
      parentId,
      citizenId,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      updatedAt: new Date(),
    };
    if (id) await getDb().update(offices).set(values).where(eq(offices.id, id));
    else await getDb().insert(offices).values(values);
  } catch (error) {
    return actionError(error);
  }

  revalidatePath("/organigramme");
  redirect("/organigramme");
}

export async function deleteOffice(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !can(user, "organigramme.ecrire")) return { error: "Tu ne peux pas retirer cet office." };
  const id = readText(formData, "id", 80);
  try {
    const rows = await getDb().select({ id: offices.id, parentId: offices.parentId }).from(offices);
    if (descendantIds(rows, id).size) {
      return { error: "Déplace d'abord les offices qui en dépendent." };
    }
    await getDb().delete(offices).where(eq(offices.id, id));
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/organigramme");
  redirect("/organigramme");
}

export async function saveDecree(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expirée." };
  const id = readText(formData, "id", 80);
  const title = readText(formData, "title", 180);
  const preamble = readText(formData, "preamble", 1000);
  const body = readText(formData, "body", 100_000);
  let status = readText(formData, "status", 20);
  if (title.length < 2 || !body) return { error: "Un décret a besoin d'un titre et d'un texte." };
  if (!["draft", "published", "repealed"].includes(status)) return { error: "Statut inconnu." };

  if (!canVoice(user)) return { error: "Seuls le Gaelor et le Conseil rédigent la voix de la nation." };

  try {
    const existing = id ? await getDb().query.decrees.findFirst({ where: eq(decrees.id, id) }) : null;
    if (id && !existing) return { error: "Décret introuvable." };
    if (existing?.status === "draft" && status === "repealed") status = "draft";

    const now = new Date();
    const publishedAt =
      status === "published" ? existing?.publishedAt ?? now : existing?.publishedAt ?? null;
    let reference = existing?.reference ?? null;
    if (status === "published" && !reference) {
      const published = await getDb().query.decrees.findMany();
      const sequence = published.filter((decree) => decree.reference).length + 1;
      reference = `GAE-${String(sequence).padStart(3, "0")}`;
    }

    const values = {
      title,
      preamble,
      body,
      status,
      reference,
      publishedAt,
      repealedAt: status === "repealed" ? existing?.repealedAt ?? now : null,
      updatedAt: now,
    };

    if (id) await getDb().update(decrees).set(values).where(eq(decrees.id, id));
    else await getDb().insert(decrees).values({ ...values, authorId: user.id });
  } catch (error) {
    return actionError(error);
  }

  revalidatePath("/decrets");
  revalidatePath("/parvis");
  revalidatePath("/hall");
  redirect("/decrets");
}

export async function saveParchment(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) return { error: "Seuls le Gaelor et le Conseil affichent un parchemin." };
  const id = readText(formData, "id", 80);
  const title = readText(formData, "title", 160);
  const body = readText(formData, "body", 20_000);
  const status = readText(formData, "status", 20) || "published";
  if (title.length < 2 || !body) return { error: "Le parchemin a besoin d'un titre et d'un texte." };
  if (!["draft", "published"].includes(status)) return { error: "Statut inconnu." };

  try {
    const existing = id ? await getDb().query.parchments.findFirst({ where: eq(parchments.id, id) }) : null;
    if (id && !existing) return { error: "Parchemin introuvable." };
    const now = new Date();
    const values = {
      title,
      body,
      status,
      pinned: formData.get("pinned") === "on",
      publishedAt: status === "published" ? existing?.publishedAt ?? now : existing?.publishedAt ?? now,
      updatedAt: now,
    };
    if (id) await getDb().update(parchments).set(values).where(eq(parchments.id, id));
    else await getDb().insert(parchments).values({ ...values, authorId: user.id });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/parchemins");
  revalidatePath("/parvis");
  revalidatePath("/hall");
  redirect("/parchemins");
}

export async function deleteParchment(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) return { error: "Tu ne peux pas retirer ce parchemin." };
  const id = readText(formData, "id", 80);
  try {
    await getDb().delete(parchments).where(eq(parchments.id, id));
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/parchemins");
  revalidatePath("/parvis");
  redirect("/parchemins");
}
