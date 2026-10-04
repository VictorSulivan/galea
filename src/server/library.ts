"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { actionError, type ActionState } from "@/lib/action";
import { getDb } from "@/lib/db";
import { books, chapters, grants, shelves } from "@/lib/db/schema";
import { readDay, readText, slugify } from "@/lib/format";
import { PAGE_TITLE_MAX, clampPageBody, pageOverflowMessage } from "@/lib/book-page";
import { can, canWriteBook, canWriteShelf, clampLevel, shelfKey, shelfLevel, type Sensitivity } from "@/lib/permissions";
import { safeObjectKey } from "@/lib/storage";

type ChapterInput = { title: string; body: string };

function parseChapters(raw: string): ChapterInput[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 80) return null;
    return parsed.map((item) => {
      const chapter = item as { title?: unknown; body?: unknown };
      const title = typeof chapter.title === "string" ? chapter.title.trim().slice(0, PAGE_TITLE_MAX) : "";
      const body = typeof chapter.body === "string" ? clampPageBody(chapter.body) : "";
      return { title, body };
    });
  } catch {
    return null;
  }
}

export async function saveBook(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expirée." };

  const shelfId = readText(formData, "shelfId", 80);
  const bookId = readText(formData, "bookId", 80);
  const title = readText(formData, "title", 180);
  const subtitle = readText(formData, "subtitle", 180);
  const summary = readText(formData, "summary", 2000);
  const status = readText(formData, "status", 20);
  const chapterList = parseChapters(String(formData.get("chapters") ?? ""));
  const cover = readText(formData, "coverKey", 200);

  if (!title) return { error: "Le livre a besoin d'un titre." };
  if (!["draft", "published", "archived"].includes(status)) return { error: "Statut inconnu." };
  if (!chapterList || chapterList.some((chapter) => !chapter.title)) {
    return { error: "Chaque chapitre doit avoir un titre." };
  }
  const overflow = pageOverflowMessage(chapterList);
  if (overflow) return { error: overflow };

  try {
    const shelf = await getDb().query.shelves.findFirst({ where: eq(shelves.id, shelfId) });
    if (!shelf || !canWriteShelf(user, shelf.slug)) {
      return { error: "Ce rayon ne t'est pas ouvert à l'écriture." };
    }
    const bookLevel = clampLevel(Number(readText(formData, "level", 1)) || 1);
    if (bookLevel < 1) return { error: "Choisis un degré entre 1 et 5." };
    if (shelfLevel(user, shelf.slug) < bookLevel) {
      return { error: "Ce degré dépasse le tien sur ce rayon." };
    }

    const values = {
      title,
      subtitle,
      summary,
      status,
      level: bookLevel,
      occurredOn: readDay(formData, "occurredOn"),
      coverKey: cover ? safeObjectKey(cover) : null,
      updatedAt: new Date(),
    };

    let id = bookId;
    if (id) {
      const existing = await getDb().query.books.findFirst({ where: eq(books.id, id) });
      if (!existing || existing.shelfId !== shelf.id) return { error: "Livre introuvable." };
      if (!canWriteBook(user, shelf.slug, existing.level)) {
        return { error: "Ce livre est d'un degré trop haut pour ta plume." };
      }
      await getDb().update(books).set(values).where(eq(books.id, id));
      await getDb().delete(chapters).where(eq(chapters.bookId, id));
    } else {
      const [created] = await getDb()
        .insert(books)
        .values({ ...values, shelfId: shelf.id, authorId: user.id })
        .returning({ id: books.id });
      id = created.id;
    }

    await getDb()
      .insert(chapters)
      .values(
        chapterList.map((chapter, index) => ({
          bookId: id,
          title: chapter.title,
          body: chapter.body,
          sortOrder: index,
        })),
      );

    revalidatePath("/bibliotheque");
    revalidatePath(`/bibliotheque/${shelf.slug}`);
    revalidatePath(`/bibliotheque/${shelf.slug}/${id}`);
    redirect(`/bibliotheque/${shelf.slug}/${id}`);
  } catch (error) {
    return actionError(error);
  }
}

export async function placeBook(bookId: string, level: number): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expirée." };
  const next = clampLevel(level);
  if (next < 1 || next > 5) return { error: "Les étagères vont de I à V." };

  const book = await getDb().query.books.findFirst({
    where: eq(books.id, bookId),
    with: { shelf: true },
  });
  if (!book?.shelf) return { error: "Livre introuvable." };
  if (!canWriteBook(user, book.shelf.slug, book.level)) return { error: "Tu ne peux pas déplacer ce livre." };
  if (shelfLevel(user, book.shelf.slug) < next) return { error: "Cette étagère est au-dessus de ton degré." };

  await getDb().update(books).set({ level: next, updatedAt: new Date() }).where(eq(books.id, bookId));
  revalidatePath("/bibliotheque");
  revalidatePath(`/bibliotheque/${book.shelf.slug}`);
  revalidatePath(`/bibliotheque/${book.shelf.slug}/${bookId}`);
  return {};
}

export async function deleteBook(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expirée." };
  const id = readText(formData, "id", 80);

  try {
    const book = await getDb().query.books.findFirst({
      where: eq(books.id, id),
      with: { shelf: true },
    });
    if (!book?.shelf || !canWriteBook(user, book.shelf.slug, book.level)) {
      return { error: "Tu ne peux pas retirer ce livre." };
    }
    await getDb().delete(books).where(eq(books.id, id));
    revalidatePath(`/bibliotheque/${book.shelf.slug}`);
    redirect(`/bibliotheque/${book.shelf.slug}`);
  } catch (error) {
    return actionError(error);
  }
}

export async function saveShelf(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !can(user, "rayons.gerer")) return { error: "Tu ne peux pas ordonner les rayons." };

  const name = readText(formData, "name", 80);
  const description = readText(formData, "description", 500);
  const sensitivity = readText(formData, "sensitivity", 20) as Sensitivity;
  const slugInput = readText(formData, "slug", 60);
  const slug = slugify(slugInput || name);
  if (!name || !slug) return { error: "Le rayon a besoin d'un nom." };
  if (!["ouvert", "restreint", "secret"].includes(sensitivity)) return { error: "Sensibilité inconnue." };

  try {
    const existing = await getDb().query.shelves.findMany();
    if (existing.some((shelf) => shelf.slug === slug)) {
      return { error: "Un rayon porte déjà ce nom." };
    }
    const sortOrder = existing.reduce((max, shelf) => Math.max(max, shelf.sortOrder), 0) + 10;
    await getDb().insert(shelves).values({ name, description, sensitivity, slug, sortOrder });
    await getDb().insert(grants).values({ userId: user.id, key: shelfKey(slug), level: 5 }).onConflictDoNothing();
  } catch (error) {
    return actionError(error);
  }

  revalidatePath("/bibliotheque");
  revalidatePath("/administration/rayons");
  redirect(readText(formData, "back", 40) === "bibliotheque" ? `/bibliotheque/${slug}` : "/administration/rayons");
}

