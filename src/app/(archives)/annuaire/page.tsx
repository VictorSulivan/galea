import Link from "next/link";
import { asc, desc, ilike, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Empty, PageHeader, Panel, Portrait } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { people } from "@/lib/db/schema";
import { likeTerm } from "@/lib/format";
import { can } from "@/lib/permissions";

export const metadata = { title: "Annuaire" };

export default async function AnnuairePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !can(user, "zone.annuaire")) redirect("/hall");
  const { q = "" } = await searchParams;
  const query = q.trim();
  const rows = await getDb()
    .select()
    .from(people)
    .where(
      query
        ? or(ilike(people.name, likeTerm(query)), ilike(people.nation, likeTerm(query)), ilike(people.office, likeTerm(query)))
        : undefined,
    )
    .orderBy(desc(people.featured), asc(people.name));

  return (
    <div>
      <PageHeader
        kicker="Le serveur"
        title="Annuaire"
        lede="Les personnes qui comptent, dans Gaélia et au-delà."
        action={
          can(user, "annuaire.ecrire") ? (
            <Link href="/annuaire/nouveau" className="rounded-full bg-gold px-4 py-2 text-sm text-moss-deep">
              Nouvelle fiche
            </Link>
          ) : null
        }
      />
      <form className="mb-6">
        <input
          name="q"
          defaultValue={query}
          placeholder="Nom, nation, fonction"
          className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-parchment outline-none placeholder:text-sap/60"
        />
      </form>
      {rows.length === 0 ? <Empty title="L'annuaire est encore silencieux" text="La première fiche peut être un chef de nation, un patron d'atelier, ou un nom qu'il ne faut pas oublier." /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((person) => (
          <Link key={person.id} href={`/annuaire/${person.id}`}>
            <Panel className="flex h-full gap-4">
              <Portrait storageKey={person.portraitKey} name={person.name} />
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-gold-deep">{person.nation}</p>
                <h2 className="font-display text-3xl">{person.name}</h2>
                <p className="text-ink-soft">{person.office}</p>
                {person.summary ? <p className="mt-2 text-sm">{person.summary}</p> : null}
              </div>
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  );
}
