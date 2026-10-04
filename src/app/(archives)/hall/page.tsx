import Link from "next/link";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { books, citizens, decrees, letters, shelves } from "@/lib/db/schema";
import { excerpt, formatDate } from "@/lib/format";
import { can, canReadBook, canReadShelf, homePath } from "@/lib/permissions";

export const metadata = { title: "La table" };

export default async function HallPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (!can(user, "zone.hall")) redirect(homePath(user));

  const db = getDb();
  const [shelfRows, letterRows, decreeRows, publishedDecrees, publishedLetters, citizenCount] = await Promise.all([
    db.select().from(shelves).orderBy(asc(shelves.sortOrder)),
    db.query.letters.findMany({
      where: eq(letters.status, "published"),
      with: { author: true },
      orderBy: [desc(letters.publishedAt)],
      limit: 3,
    }),
    db.select().from(decrees).where(eq(decrees.status, "published")).orderBy(desc(decrees.publishedAt)).limit(3),
    db.select({ id: decrees.id }).from(decrees).where(eq(decrees.status, "published")),
    db.select({ id: letters.id }).from(letters).where(eq(letters.status, "published")),
    can(user, "zone.recensement") ? db.select({ id: citizens.id }).from(citizens) : Promise.resolve([]),
  ]);

  const readable = shelfRows.filter((shelf) => canReadShelf(user, shelf.slug));
  const recentBooks = readable.length
    ? (
        await db.query.books.findMany({
          where: and(inArray(books.shelfId, readable.map((shelf) => shelf.id)), eq(books.status, "published")),
          with: { shelf: true },
          orderBy: (table, operators) => [operators.desc(table.updatedAt)],
          limit: 12,
        })
      )
        .filter((book) => book.shelf && canReadBook(user, book.shelf.slug, book.level))
        .slice(0, 4)
    : [];

  const parvisCount = publishedDecrees.length + publishedLetters.length;
  const tiles = [
    { label: "Rayons ouverts", value: String(readable.length) },
    { label: "Textes au Parvis", value: String(parvisCount) },
    ...(can(user, "zone.recensement") ? [{ label: "Âmes recensées", value: String(citizenCount.length) }] : []),
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Nation de la terre et de la nature</p>
      <h1 className="mt-2 font-display text-5xl tracking-tight">Table de Gaélia</h1>
      <p className="mt-3 max-w-2xl text-sap">L’espace privé de la nation. Les décrets et lettres publiés se lisent aussi dehors, sans connexion.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-gold/25 bg-black/20 px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-gold">{tile.label}</p>
            <p className="mt-1 font-display text-4xl">{tile.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          {letterRows.map((item) => (
            <Link key={item.id} href={`/parvis/lettres/${item.id}`} className="parchment block rounded-[1.6rem] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-gold-deep">
                  Lettre · {formatDate(item.publishedAt)}
                </p>
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#8d6b32]">{item.author?.displayName ?? "La nation"}</p>
              </div>
              <h2 className="mt-2 font-display text-3xl text-ink">{item.subject}</h2>
              <p className="mt-3 line-clamp-5 font-serif leading-7 text-ink">{excerpt(item.body, 220)}</p>
            </Link>
          ))}
          {letterRows.length === 0 ? <p className="text-center font-serif text-xl text-sap">Aucune lettre n’est encore publiée.</p> : null}
        </div>
        <div className="grid content-start gap-3">
          {recentBooks.map((book) => (
            <Link key={book.id} href={`/bibliotheque/${book.shelf?.slug}/${book.id}`} className="rounded-2xl border border-white/10 px-4 py-3 hover:border-gold/40">
              <p className="text-[11px] uppercase tracking-[0.16em] text-gold">{book.shelf?.name} · degré {book.level}</p>
              <p className="font-display text-2xl">{book.title}</p>
            </Link>
          ))}
          {decreeRows.map((decree) => (
            <Link key={decree.id} href={`/parvis/decrets/${decree.id}`} className="rounded-2xl border border-white/10 px-4 py-3 hover:border-gold/40">
              <p className="text-[11px] uppercase tracking-[0.16em] text-gold">{decree.reference}</p>
              <p className="font-serif text-xl">{decree.title}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
