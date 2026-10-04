"use server";

import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { actionError, type ActionState } from "@/lib/action";
import { getDb } from "@/lib/db";
import { directoryCategories, people } from "@/lib/db/schema";
import { readText } from "@/lib/format";
import { can } from "@/lib/permissions";
import { safeObjectKey } from "@/lib/storage";

function portrait(formData: FormData) {
  const key = readText(formData, "portraitKey", 200);
  if (!key) return null;
  return safeObjectKey(key);
}

export async function savePerson(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !can(user, "annuaire.ecrire")) return { error: "Tu ne peux pas rédiger l'annuaire." };

  const id = readText(formData, "id", 80);
  const name = readText(formData, "name", 120);
  const categoryId = readText(formData, "categoryId", 80);
  const office = readText(formData, "office", 120);
  const summary = readText(formData, "summary", 500);
  const notes = readText(formData, "notes", 8000);
  if (name.length < 2 || office.length < 2) {
    return { error: "Le nom et la fonction sont nécessaires." };
  }
  const category = categoryId
    ? await getDb().query.directoryCategories.findFirst({ where: eq(directoryCategories.id, categoryId) })
    : null;
  if (!category) return { error: "Choisis une catégorie dans la liste." };

  const values = {
    name,
    categoryId: category.id,
    office,
    summary,
    notes,
    portraitKey: portrait(formData),
    featured: formData.get("featured") === "on",
    updatedAt: new Date(),
  };

  try {
    if (id) {
      await getDb().update(people).set(values).where(eq(people.id, id));
      revalidatePath("/annuaire");
      revalidatePath(`/annuaire/${id}`);
      redirect(`/annuaire/${id}`);
    }
    const [created] = await getDb()
      .insert(people)
      .values({ ...values, createdBy: user.id })
      .returning({ id: people.id });
    revalidatePath("/annuaire");
    redirect(`/annuaire/${created.id}`);
  } catch (error) {
    return actionError(error);
  }
}

export async function deletePerson(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !can(user, "annuaire.ecrire")) return { error: "Tu ne peux pas retirer cette fiche." };
  const id = readText(formData, "id", 80);
  try {
    await getDb().delete(people).where(eq(people.id, id));
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/annuaire");
  redirect("/annuaire");
}

export async function saveCategory(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !can(user, "annuaire.ecrire")) return { error: "Tu ne peux pas tenir les catégories." };
  const id = readText(formData, "id", 80);
  const name = readText(formData, "name", 80);
  const rawOrder = String(formData.get("sortOrder") ?? "").trim();
  const sortOrder = rawOrder === "" ? null : Number(rawOrder);
  if (name.length < 2) return { error: "La catégorie doit porter un nom." };
  if (sortOrder !== null && !Number.isFinite(sortOrder)) return { error: "L'ordre doit être un nombre." };

  try {
    const taken = await getDb().query.directoryCategories.findFirst({ where: eq(directoryCategories.name, name) });
    if (taken && taken.id !== id) return { error: "Cette catégorie existe déjà." };
    if (id) {
      await getDb()
        .update(directoryCategories)
        .set({ name, sortOrder: Math.round(sortOrder ?? 0), updatedAt: new Date() })
        .where(eq(directoryCategories.id, id));
    } else {
      const last = await getDb().select({ sortOrder: directoryCategories.sortOrder }).from(directoryCategories).orderBy(asc(directoryCategories.sortOrder));
      const next = last.length ? last[last.length - 1].sortOrder + 10 : 0;
      await getDb().insert(directoryCategories).values({ name, sortOrder: Math.round(sortOrder ?? next) });
    }
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/annuaire");
  revalidatePath("/annuaire/categories");
  return { ok: id ? "Catégorie enregistrée." : "Catégorie ajoutée." };
}

export async function deleteCategory(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !can(user, "annuaire.ecrire")) return { error: "Tu ne peux pas retirer une catégorie." };
  const id = readText(formData, "id", 80);
  try {
    const used = await getDb().select({ count: sql<number>`count(*)::int` }).from(people).where(eq(people.categoryId, id));
    if ((used[0]?.count ?? 0) > 0) return { error: "Cette catégorie porte encore des étiquettes." };
    await getDb().delete(directoryCategories).where(eq(directoryCategories.id, id));
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/annuaire");
  revalidatePath("/annuaire/categories");
  return { ok: "Catégorie retirée." };
}
