"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { actionError, type ActionState } from "@/lib/action";
import { getDb } from "@/lib/db";
import { letters } from "@/lib/db/schema";
import { readText } from "@/lib/format";
import { canVoice } from "@/lib/permissions";

export async function saveLetter(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) return { error: "Seuls le Gaelor et le Conseil rédigent une lettre officielle." };

  const id = readText(formData, "id", 80);
  const subject = readText(formData, "subject", 180);
  const body = readText(formData, "body", 50_000);
  const status = readText(formData, "status", 20) || "draft";

  if (subject.length < 2) return { error: "La lettre a besoin d'un objet." };
  if (!["draft", "published"].includes(status)) return { error: "Statut inconnu." };
  if (status === "published" && !body) return { error: "Une lettre publiée ne peut pas être vide." };

  try {
    const now = new Date();
    let letterId = id;
    if (letterId) {
      const existing = await getDb().query.letters.findFirst({ where: eq(letters.id, letterId) });
      if (!existing) return { error: "Lettre introuvable." };
      await getDb()
        .update(letters)
        .set({
          subject,
          body,
          status,
          publishedAt: status === "published" ? existing.publishedAt ?? now : existing.publishedAt,
          updatedAt: now,
        })
        .where(eq(letters.id, letterId));
    } else {
      const [created] = await getDb()
        .insert(letters)
        .values({
          authorId: user.id,
          subject,
          body,
          status,
          publishedAt: status === "published" ? now : null,
        })
        .returning({ id: letters.id });
      letterId = created.id;
    }

    revalidatePath("/lettres");
    revalidatePath("/parvis");
    revalidatePath("/hall");
    redirect(status === "published" ? "/parvis" : `/lettres/${letterId}`);
  } catch (error) {
    return actionError(error);
  }
}
