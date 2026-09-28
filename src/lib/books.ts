import { and, asc, eq, inArray } from "drizzle-orm";
import { getCurrentUser, type SessionUser } from "./auth";
import { getDb } from "./db";
import { books, shelves } from "./db/schema";
import { canReadBook, canReadShelf, canWriteBook, canWriteShelf, shelfLevel } from "./permissions";

export function bookVisible(user: SessionUser, book: { status: string; authorId: string | null; level: number }, slug: string) {
  if (!canReadBook(user, slug, book.level) && !canWriteBook(user, slug, book.level)) return false;
  if (book.status === "published") return canReadBook(user, slug, book.level) || canWriteBook(user, slug, book.level);
  return canWriteBook(user, slug, book.level) || book.authorId === user.id;
}

export type StageBook = {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  status: string;
  level: number;
  occurredOn: string | null;
  author: string;
  haystack: string;
};

export type StageShelf = {
  slug: string;
  name: string;
  description: string;
  sensitivity: string;
  level: number;
  writable: boolean;
  books: StageBook[];
};

export async function loadLibraryStage(user: SessionUser): Promise<StageShelf[]> {
  const db = getDb();
  const shelfRows = (await db.select().from(shelves).orderBy(asc(shelves.sortOrder))).filter(
    (shelf) => canReadShelf(user, shelf.slug) || canWriteShelf(user, shelf.slug),
  );
  if (!shelfRows.length) return [];
  const rows = await db.query.books.findMany({
    where: inArray(
      books.shelfId,
      shelfRows.map((shelf) => shelf.id),
    ),
    with: { author: true, chapters: true },
    orderBy: (table, operators) => [operators.desc(table.updatedAt)],
  });
  const byShelf = new Map<string, StageBook[]>();
  for (const book of rows) {
    const shelf = shelfRows.find((item) => item.id === book.shelfId);
    if (!shelf || !bookVisible(user, book, shelf.slug)) continue;
    const haystack = [book.title, book.subtitle, book.summary, ...book.chapters.map((chapter) => `${chapter.title}\n${chapter.body.slice(0, 2500)}`)]
      .join("\n")
      .toLowerCase();
    const list = byShelf.get(shelf.id) ?? [];
    list.push({
      id: book.id,
      title: book.title,
      subtitle: book.subtitle,
      summary: book.summary,
      status: book.status,
      level: book.level,
      occurredOn: book.occurredOn,
      author: book.author?.displayName ?? "Main anonyme",
      haystack,
    });
    byShelf.set(shelf.id, list);
  }
  return shelfRows.map((shelf) => ({
    slug: shelf.slug,
    name: shelf.name,
    description: shelf.description,
    sensitivity: shelf.sensitivity,
    level: shelfLevel(user, shelf.slug),
    writable: canWriteShelf(user, shelf.slug),
    books: byShelf.get(shelf.id) ?? [],
  }));
}

export async function loadShelf(slug: string) {
  const user = await getCurrentUser();
  if (!user) return null;
  const shelf = await getDb().query.shelves.findFirst({ where: eq(shelves.slug, slug) });
  if (!shelf || (!canReadShelf(user, slug) && !canWriteShelf(user, slug))) return null;
  return { user, shelf };
}

export async function loadBook(slug: string, bookId: string) {
  const context = await loadShelf(slug);
  if (!context) return null;
  const book = await getDb().query.books.findFirst({
    where: and(eq(books.id, bookId), eq(books.shelfId, context.shelf.id)),
    with: { chapters: true, author: true },
  });
  if (!book || !bookVisible(context.user, book, slug)) return null;
  return { ...context, book };
}
