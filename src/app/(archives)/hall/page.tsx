import Link from "next/link";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Greet } from "@/components/archives-scene";
import { Badge } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { books, citizens, decrees, letters, parchments, shelves } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";
import { can, canReadBook, canReadShelf, homePath } from "@/lib/permissions";

export const metadata = { title: "Le Hall" };

export default async function HallPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (!can(user, "zone.hall")) redirect(homePath(user));

  const db = getDb();
  const [shelfRows, parchmentRows, decreeRows, publishedDecrees, publishedParchments, publishedLetters, citizenCount] = await Promise.all([
    db.select().from(shelves).orderBy(asc(shelves.sortOrder)),
    db.select().from(parchments).where(eq(parchments.status, "published")).orderBy(desc(parchments.pinned), desc(parchments.publishedAt)).limit(3),
    db.select().from(decrees).where(eq(decrees.status, "published")).orderBy(desc(decrees.publishedAt)).limit(3),
    db.select({ id: decrees.id }).from(decrees).where(eq(decrees.status, "published")),
    db.select({ id: parchments.id }).from(parchments).where(eq(parchments.status, "published")),
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

  const parvisCount = publishedDecrees.length + publishedParchments.length + publishedLetters.length;
  const news = [
    can(user, "zone.recensement") ? `${citizenCount.length} âmes sont au recensement` : null,
    `${parvisCount} texte${parvisCount > 1 ? "s" : ""} ${parvisCount > 1 ? "sont cloués" : "est cloué"} au Parvis`,
    `${readable.length} rayon${readable.length > 1 ? "s" : ""} s’ouvre${readable.length > 1 ? "nt" : ""} à ton degré`,
    recentBooks[0] ? `le dernier livre à ta portée est « ${recentBooks[0].title} »` : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="arrive mx-auto max-w-5xl pt-6">
      <Greet news={news} />
      <p className="text-center text-xs uppercase tracking-[0.22em] text-gold">Terre, racine, mémoire</p>
      <h1 className="mt-2 text-center font-display text-5xl tracking-tight">Sous les racines, le visage reste dans l’ombre.</h1>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          {parchmentRows.map((item) => (
            <Link key={item.id} href={`/parvis/parchemins/${item.id}`} className="parchment block rounded-[1.6rem] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-gold-deep">{formatDate(item.publishedAt)}</p>
                {item.pinned ? <Badge>Épinglé</Badge> : null}
              </div>
              <h2 className="mt-2 font-display text-3xl text-ink">{item.title}</h2>
              <p className="mt-3 line-clamp-5 font-serif leading-7 text-ink">{item.body}</p>
            </Link>
          ))}
          {parchmentRows.length === 0 ? <p className="text-center font-serif text-xl text-sap">Aucun parchemin n’est encore cloué.</p> : null}
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
