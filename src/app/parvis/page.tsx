import Link from "next/link";
import { desc, eq, or } from "drizzle-orm";
import { Badge, Empty } from "@/components/ui";
import { PublicFrame } from "@/components/public-frame";
import { getDb } from "@/lib/db";
import { decrees, letters, parchments } from "@/lib/db/schema";
import { DECREE_STATUS, formatDate } from "@/lib/format";

export const metadata = { title: "Le Parvis" };

export default async function ParvisPage() {
  const db = getDb();
  const [decreeRows, parchmentRows, letterRows] = await Promise.all([
    db
      .select()
      .from(decrees)
      .where(or(eq(decrees.status, "published"), eq(decrees.status, "repealed")))
      .orderBy(desc(decrees.publishedAt)),
    db.select().from(parchments).where(eq(parchments.status, "published")).orderBy(desc(parchments.pinned), desc(parchments.publishedAt)),
    db.query.letters.findMany({
      where: eq(letters.status, "published"),
      with: { author: true },
      orderBy: [desc(letters.publishedAt)],
    }),
  ]);

  return (
    <PublicFrame>
      <p className="text-gold">Place publique</p>
      <h1 className="mt-2 max-w-3xl font-display text-5xl leading-[0.95] tracking-tight md:text-6xl">
        Ce que les dirigeants de Gaélia ont choisi de dire.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-sap">
        Décrets, parchemins et lettres officielles. Gaéliens et visiteurs lisent ici la même voix. Les brouillons restent dans les archives.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-4xl">Parchemins</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {parchmentRows.length === 0 ? <Empty title="Aucun avis" text="Les annonces apparaîtront ici dès qu'elles seront affichées." /> : null}
          {parchmentRows.map((item) => (
            <Link key={item.id} href={`/parvis/parchemins/${item.id}`} className="parchment block rounded-[1.6rem] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-gold-deep">{formatDate(item.publishedAt)}</p>
                {item.pinned ? <Badge>Épinglé</Badge> : null}
              </div>
              <h3 className="mt-2 font-display text-3xl text-ink">{item.title}</h3>
              <p className="mt-3 line-clamp-5 font-serif leading-7 text-ink">{item.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl">Décrets</h2>
          <div className="mt-4 grid gap-3">
            {decreeRows.length === 0 ? <p className="text-sap">Aucun décret promulgué.</p> : null}
            {decreeRows.map((decree) => (
              <Link key={decree.id} href={`/parvis/decrets/${decree.id}`} className="rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/5">
                <p className="text-xs text-gold">
                  {decree.reference ?? "Sans numéro"} · {DECREE_STATUS[decree.status] ?? decree.status}
                </p>
                <p className="font-display text-2xl">{decree.title}</p>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-display text-4xl">Lettres</h2>
          <div className="mt-4 grid gap-3">
            {letterRows.length === 0 ? <p className="text-sap">Aucune lettre officielle publiée.</p> : null}
            {letterRows.map((letter) => (
              <Link key={letter.id} href={`/parvis/lettres/${letter.id}`} className="rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/5">
                <p className="text-xs text-gold">{letter.author?.displayName ?? "La nation"} · {formatDate(letter.publishedAt)}</p>
                <p className="font-display text-2xl">{letter.subject}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicFrame>
  );
}
