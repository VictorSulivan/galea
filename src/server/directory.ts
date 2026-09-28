"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { actionError, type ActionState } from "@/lib/action";
import { getDb } from "@/lib/db";
import { people } from "@/lib/db/schema";
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
  const nation = readText(formData, "nation", 80);
  const office = readText(formData, "office", 120);
  const summary = readText(formData, "summary", 500);
  const notes = readText(formData, "notes", 8000);
  if (name.length < 2 || nation.length < 2 || office.length < 2) {
    return { error: "Le nom, la nation et la fonction sont nécessaires." };
  }

  const values = {
    name,
    nation,
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
