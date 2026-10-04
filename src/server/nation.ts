"use server";

import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { actionError, type ActionState } from "@/lib/action";
import { getDb } from "@/lib/db";
import { citizenGrades, citizens, decrees, offices, users, voiceNotes } from "@/lib/db/schema";
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
  const gradeId = readText(formData, "gradeId", 80);
  const superiorId = readText(formData, "superiorId", 80) || null;
  const status = readText(formData, "status", 20);
  const notes = readText(formData, "notes", 8000);
  const userId = readText(formData, "userId", 80);
  const portrait = readText(formData, "portraitKey", 200);

  if (name.length < 2) return { error: "Le membre a besoin d'un nom." };
  if (!CITIZEN_STATUSES.includes(status)) return { error: "Statut inconnu." };
  const grade = gradeId ? await getDb().query.citizenGrades.findFirst({ where: eq(citizenGrades.id, gradeId) }) : null;
  if (!grade) return { error: "Choisis un grade dans la liste." };
  if (superiorId && superiorId === id) return { error: "Un membre ne peut pas être son propre supérieur." };

  const isGaelor = grade.name.toLowerCase() === "gaelor";
  let nextSuperiorId = isGaelor ? null : superiorId;
  if (nextSuperiorId) {
    const superior = await getDb().query.citizens.findFirst({ where: eq(citizens.id, nextSuperiorId) });
    if (!superior) return { error: "Ce supérieur n'est pas au recensement." };
  }

  try {
    if (!isGaelor && nextSuperiorId && id) {
      const chain = await getDb().select({ id: citizens.id, superiorId: citizens.superiorId }).from(citizens);
      let cursor: string | null = nextSuperiorId;
      const seen = new Set<string>([id]);
      while (cursor) {
        if (seen.has(cursor)) return { error: "Cette chaîne de commandement boucle sur elle-même." };
        seen.add(cursor);
        cursor = chain.find((row) => row.id === cursor)?.superiorId ?? null;
      }
    }

    const heldOffice = id
      ? await getDb().query.offices.findFirst({ where: eq(offices.citizenId, id) })
      : null;
    if (!isGaelor && heldOffice && !nextSuperiorId) {
      return { error: "Ce membre tient un office : indique son supérieur." };
    }

    const values = {
      name,
      epithet,
      gradeId: grade.id,
      superiorId: nextSuperiorId,
      status,
      notes,
      joinedOn: readDay(formData, "joinedOn"),
      userId: userId || null,
      portraitKey: portrait ? safeObjectKey(portrait) : null,
      updatedAt: new Date(),
    };

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

export async function saveGrade(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !can(user, "recensement.ecrire")) return { error: "Tu ne peux pas tenir les grades." };
  const id = readText(formData, "id", 80);
  const name = readText(formData, "name", 80);
  const rawOrder = String(formData.get("sortOrder") ?? "").trim();
  const sortOrder = rawOrder === "" ? null : Number(rawOrder);
  if (name.length < 2) return { error: "Le grade doit porter un nom." };
  if (sortOrder !== null && !Number.isFinite(sortOrder)) return { error: "L'ordre doit être un nombre." };

  try {
    const taken = await getDb().query.citizenGrades.findFirst({ where: eq(citizenGrades.name, name) });
    if (taken && taken.id !== id) return { error: "Ce grade existe déjà." };
    if (id) {
      await getDb()
        .update(citizenGrades)
        .set({ name, sortOrder: Math.round(sortOrder ?? 0), updatedAt: new Date() })
        .where(eq(citizenGrades.id, id));
    } else {
      const last = await getDb().select({ sortOrder: citizenGrades.sortOrder }).from(citizenGrades).orderBy(asc(citizenGrades.sortOrder));
      const next = last.length ? last[last.length - 1].sortOrder + 10 : 0;
      await getDb().insert(citizenGrades).values({ name, sortOrder: Math.round(sortOrder ?? next) });
    }
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/recensement");
  revalidatePath("/recensement/grades");
  return { ok: id ? "Grade enregistré." : "Grade ajouté." };
}

export async function deleteGrade(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !can(user, "recensement.ecrire")) return { error: "Tu ne peux pas retirer un grade." };
  const id = readText(formData, "id", 80);
  try {
    const used = await getDb().select({ count: sql<number>`count(*)::int` }).from(citizens).where(eq(citizens.gradeId, id));
    if ((used[0]?.count ?? 0) > 0) return { error: "Ce grade est encore porté par des membres." };
    await getDb().delete(citizenGrades).where(eq(citizenGrades.id, id));
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/recensement");
  revalidatePath("/recensement/grades");
  return { ok: "Grade retiré." };
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
      const citizen = await getDb().query.citizens.findFirst({
        where: eq(citizens.id, citizenId),
        with: { grade: true },
      });
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

    if (citizenId && parentId) {
      const parentOffice = await getDb().query.offices.findFirst({ where: eq(offices.id, parentId) });
      const parentCitizenId = parentOffice?.citizenId ?? null;
      if (parentCitizenId && parentCitizenId !== citizenId) {
        const holder = await getDb().query.citizens.findFirst({
          where: eq(citizens.id, citizenId),
          with: { grade: true },
        });
        if (holder && holder.grade.name.toLowerCase() !== "gaelor") {
          await getDb()
            .update(citizens)
            .set({ superiorId: parentCitizenId, updatedAt: new Date() })
            .where(eq(citizens.id, citizenId));
        }
      }
    }
  } catch (error) {
    return actionError(error);
  }

  revalidatePath("/organigramme");
  revalidatePath("/recensement");
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
  const issuerRole = readText(formData, "issuerRole", 120);
  let status = readText(formData, "status", 20);
  if (title.length < 2 || !body) return { error: "Un décret a besoin d'un titre et d'un texte." };
  if (!["draft", "published", "repealed"].includes(status)) return { error: "Statut inconnu." };
  if ((status === "published" || status === "repealed") && issuerRole.length < 2) {
    return { error: "Indique le rôle qui promulgue ou abroge ce décret." };
  }

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
      issuerRole,
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
  revalidatePath("/voix");
  revalidatePath("/parvis");
  revalidatePath("/hall");
  redirect("/decrets");
}

export async function saveVoiceNote(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) return { error: "Seuls le Gaelor et le Conseil tiennent le cahier interne." };
  const id = readText(formData, "id", 80);
  const kind = readText(formData, "kind", 20);
  const title = readText(formData, "title", 180);
  const body = readText(formData, "body", 40_000);
  if (!["reunion", "evenement"].includes(kind)) return { error: "Choisis réunion ou événement." };
  if (title.length < 2 || !body) return { error: "Cette note a besoin d'un titre et d'un texte." };

  try {
    const existing = id ? await getDb().query.voiceNotes.findFirst({ where: eq(voiceNotes.id, id) }) : null;
    if (id && !existing) return { error: "Note introuvable." };
    const values = {
      kind,
      title,
      body,
      occurredOn: readDay(formData, "occurredOn"),
      updatedAt: new Date(),
    };
    if (id) {
      await getDb().update(voiceNotes).set(values).where(eq(voiceNotes.id, id));
      revalidatePath("/cahier");
      revalidatePath(`/cahier/${id}`);
      revalidatePath("/voix");
      redirect(`/cahier/${id}`);
    }
    const [created] = await getDb().insert(voiceNotes).values({ ...values, authorId: user.id }).returning({ id: voiceNotes.id });
    revalidatePath("/cahier");
    revalidatePath("/voix");
    redirect(`/cahier/${created.id}`);
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteVoiceNote(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) return { error: "Tu ne peux pas retirer cette note." };
  const id = readText(formData, "id", 80);
  try {
    const existing = await getDb().query.voiceNotes.findFirst({ where: eq(voiceNotes.id, id) });
    if (!existing) return { error: "Note introuvable." };
    await getDb().delete(voiceNotes).where(eq(voiceNotes.id, id));
    revalidatePath("/cahier");
    revalidatePath("/voix");
    redirect(existing.kind === "evenement" ? "/cahier?type=evenement" : "/cahier?type=reunion");
  } catch (error) {
    return actionError(error);
  }
}
