import Link from "next/link";
import { desc, eq, or } from "drizzle-orm";
import { DecreeSheet } from "@/components/decree-sheet";
import { Empty } from "@/components/ui";
import { PublicFrame } from "@/components/public-frame";
import { getDb } from "@/lib/db";
import { decrees, letters } from "@/lib/db/schema";
import { DECREE_STATUS, formatDate } from "@/lib/format";

export const metadata = { title: "Espace public" };

export default async function ParvisPage() {
  const db = getDb();
  const [decreeRows, letterRows] = await Promise.all([
    db
      .select()
      .from(decrees)
      .where(or(eq(decrees.status, "published"), eq(decrees.status, "repealed")))
      .orderBy(desc(decrees.publishedAt)),
    db.query.letters.findMany({
      where: eq(letters.status, "published"),
      with: { author: true },
      orderBy: [desc(letters.publishedAt)],
    }),
  ]);

  return (
    <PublicFrame>
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Nation de la terre et de la nature</p>
      <h1 className="mt-2 max-w-3xl font-display text-5xl leading-[0.95] tracking-tight md:text-6xl">Décrets de Gaélia</h1>
      <p className="mt-4 max-w-2xl text-lg text-sap">
        Ce que la nation a promulgué se lit ici, sans entrer. Les brouillons restent dans l’espace privé.
      </p>

      <section className="mt-10 grid max-w-4xl gap-4">
        {decreeRows.length === 0 ? <Empty title="Aucun décret" text="Les décrets promulgués apparaîtront ici." /> : null}
        {decreeRows.map((decree) => (
          <Link key={decree.id} href={`/parvis/decrets/${decree.id}`} className="block transition hover:-translate-y-0.5">
            <DecreeSheet
              compact
              reference={decree.reference ?? "Sans numéro"}
              title={decree.title}
              preamble={decree.preamble}
              status={DECREE_STATUS[decree.status] ?? decree.status}
              date={formatDate(decree.publishedAt)}
              issuerRole={decree.issuerRole || undefined}
            />
          </Link>
        ))}
      </section>

      {letterRows.length ? (
        <section className="mt-14 max-w-4xl">
          <h2 className="font-display text-3xl">Lettres officielles</h2>
          <div className="mt-4 grid gap-3">
            {letterRows.map((letter) => (
              <Link key={letter.id} href={`/parvis/lettres/${letter.id}`} className="rounded-2xl border border-white/10 px-4 py-3 hover:border-gold/40">
                <p className="text-[11px] uppercase tracking-[0.16em] text-gold">
                  Lettre · {letter.author?.displayName ?? "La nation"} · {formatDate(letter.publishedAt)}
                </p>
                <p className="font-display text-2xl">{letter.subject}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </PublicFrame>
  );
}
