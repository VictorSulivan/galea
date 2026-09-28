import Link from "next/link";
import { asc, ilike, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Badge, Empty, PageHeader, Panel, Portrait } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { citizens } from "@/lib/db/schema";
import { CITIZEN_STATUS, formatDay, likeTerm } from "@/lib/format";
import { can } from "@/lib/permissions";

export const metadata = { title: "Recensement" };

export default async function CensusPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !can(user, "zone.recensement")) redirect("/hall");
  const { q = "" } = await searchParams;
  const query = q.trim();
  const rows = await getDb()
    .select()
    .from(citizens)
    .where(query ? or(ilike(citizens.name, likeTerm(query)), ilike(citizens.grade, likeTerm(query))) : undefined)
    .orderBy(asc(citizens.name));

  return (
    <div>
      <PageHeader
        kicker="La nation"
        title="Recensement"
        lede="Qui appartient à Gaélia, sous quel grade, et dans quel état."
        action={
          can(user, "recensement.ecrire") ? (
            <Link href="/recensement/nouveau" className="rounded-full bg-gold px-4 py-2 text-sm text-moss-deep">
              Inscrire un membre
            </Link>
          ) : null
        }
      />
      <form className="mb-6">
        <input name="q" defaultValue={query} placeholder="Nom ou grade" className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 outline-none" />
      </form>
      {rows.length === 0 ? <Empty title="Personne n'est encore inscrit" text="Le Gaelor et ceux qui tiennent le recensement peuvent ajouter les membres ici." /> : null}
      <div className="grid gap-3">
        {rows.map((citizen) => (
          <Link key={citizen.id} href={`/recensement/${citizen.id}`}>
            <Panel className="flex items-center gap-4 !p-4">
              <Portrait storageKey={citizen.portraitKey} name={citizen.name} />
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-2xl">{citizen.name}</h2>
                <p className="text-sm text-ink-soft">{citizen.grade || "Sans grade"}{citizen.epithet ? ` · ${citizen.epithet}` : ""}</p>
              </div>
              <div className="text-right">
                <Badge tone={citizen.status === "actif" ? "leaf" : citizen.status === "tombe" || citizen.status === "exile" ? "clay" : "gold"}>
                  {CITIZEN_STATUS[citizen.status] ?? citizen.status}
                </Badge>
                <p className="mt-2 text-xs text-ink-soft">{formatDay(citizen.joinedOn)}</p>
              </div>
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  );
}
