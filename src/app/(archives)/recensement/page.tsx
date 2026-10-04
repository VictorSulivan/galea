import Link from "next/link";
import { alias } from "drizzle-orm/pg-core";
import { asc, eq, ilike, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Empty, PageHeader, Portrait } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { citizenGrades, citizens } from "@/lib/db/schema";
import { CITIZEN_STATUS, formatDay, likeTerm } from "@/lib/format";
import { can } from "@/lib/permissions";

export const metadata = { title: "Recensement" };

const STATUS_ORDER = ["actif", "en_mission", "absent", "exile", "tombe"] as const;

function listHref(query: string, statut?: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (statut) params.set("statut", statut);
  const search = params.toString();
  return search ? `/recensement?${search}` : "/recensement";
}

export default async function CensusPage({ searchParams }: { searchParams: Promise<{ q?: string; statut?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !can(user, "zone.recensement")) redirect("/hall");
  const { q = "", statut = "" } = await searchParams;
  const query = q.trim();
  const status = statut.trim();
  const db = getDb();
  const superior = alias(citizens, "superior");
  const rows = await db
    .select({
      id: citizens.id,
      name: citizens.name,
      epithet: citizens.epithet,
      status: citizens.status,
      joinedOn: citizens.joinedOn,
      notes: citizens.notes,
      portraitKey: citizens.portraitKey,
      gradeName: citizenGrades.name,
      superiorName: superior.name,
    })
    .from(citizens)
    .innerJoin(citizenGrades, eq(citizens.gradeId, citizenGrades.id))
    .leftJoin(superior, eq(citizens.superiorId, superior.id))
    .where(
      query
        ? or(
            ilike(citizens.name, likeTerm(query)),
            ilike(citizenGrades.name, likeTerm(query)),
            ilike(citizens.epithet, likeTerm(query)),
            ilike(citizens.notes, likeTerm(query)),
            ilike(superior.name, likeTerm(query)),
          )
        : undefined,
    )
    .orderBy(asc(citizens.name));

  const selected = STATUS_ORDER.find((item) => item === status);
  const visible = selected ? rows.filter((citizen) => citizen.status === selected) : rows;
  const groups = new Map<string, typeof visible>();
  for (const citizen of visible) {
    const key = STATUS_ORDER.includes(citizen.status as (typeof STATUS_ORDER)[number]) ? citizen.status : "actif";
    const list = groups.get(key) ?? [];
    list.push(citizen);
    groups.set(key, list);
  }
  const ordered = STATUS_ORDER.filter((item) => !selected || item === selected);
  const canWrite = can(user, "recensement.ecrire");

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        kicker="La nation"
        title="Recensement"
        lede="Les membres de Gaélia, rangés par état, avec grade et mémoire."
        action={
          canWrite ? (
            <div className="flex gap-2">
              <Link href="/recensement/grades" className="rounded-full border border-gold/40 px-4 py-2 text-sm text-gold">
                Grades
              </Link>
              <Link href="/recensement/nouveau" className="rounded-full bg-gold px-4 py-2 text-sm text-moss-deep">
                Inscrire un membre
              </Link>
            </div>
          ) : null
        }
      />
      <form className="mb-5">
        {selected ? <input type="hidden" name="statut" value={selected} /> : null}
        <input
          name="q"
          defaultValue={query}
          placeholder="Chercher un nom, un grade, un surnom"
          className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-parchment outline-none placeholder:text-sap/60"
        />
      </form>
      <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
        <Link href={listHref(query)} data-on={selected ? "false" : "true"} className="etiquette-chip shrink-0">
          Tous
        </Link>
        {STATUS_ORDER.map((item) => (
          <Link key={item} href={listHref(query, item)} data-on={item === selected ? "true" : "false"} className="etiquette-chip shrink-0">
            {CITIZEN_STATUS[item]}
          </Link>
        ))}
      </div>
      {visible.length === 0 ? (
        <Empty title="Personne ici" text="Aucun membre ne correspond à cette recherche, ou le recensement est encore vide." />
      ) : null}
      <div className="grid gap-10">
        {ordered.map((item) => {
          const people = groups.get(item) ?? [];
          if (people.length === 0 && query) return null;
          if (people.length === 0 && selected) {
            return (
              <section key={item}>
                <header className="mb-4 flex items-end justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src="/gaelia/bouclier.png" alt="" className="h-12 w-12" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-gold">État</p>
                      <h2 className="font-display text-3xl text-parchment">{CITIZEN_STATUS[item]}</h2>
                    </div>
                  </div>
                  <p className="text-xs uppercase tracking-[0.16em] text-sap">Aucun membre</p>
                </header>
              </section>
            );
          }
          if (people.length === 0) return null;
          return (
            <section key={item}>
              <header className="mb-4 flex items-end justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src="/gaelia/bouclier.png" alt="" className="h-12 w-12" />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-gold">État</p>
                    <h2 className="font-display text-3xl text-parchment">{CITIZEN_STATUS[item]}</h2>
                  </div>
                </div>
                <p className="text-xs uppercase tracking-[0.16em] text-sap">{people.length > 1 ? `${people.length} membres` : "1 membre"}</p>
              </header>
              <div className="grid gap-3 md:grid-cols-2">
                {people.map((citizen) => (
                  <Link key={citizen.id} href={`/recensement/${citizen.id}`} className="etiquette">
                    <Portrait storageKey={citizen.portraitKey} name={citizen.name} size="h-14 w-14" />
                    <span className="min-w-0">
                      <span className="block font-display text-2xl leading-tight">{citizen.name}</span>
                      <span className="block text-sm text-[#6b5644]">
                        {citizen.gradeName}
                        {citizen.epithet ? ` · ${citizen.epithet}` : ""}
                      </span>
                      {citizen.superiorName ? (
                        <span className="mt-1 block text-[11px] uppercase tracking-[0.14em] text-[#8d6b32]">
                          Sous {citizen.superiorName}
                        </span>
                      ) : null}
                      {citizen.joinedOn ? (
                        <span className="mt-1 block text-[11px] uppercase tracking-[0.14em] text-[#8d6b32]">Depuis {formatDay(citizen.joinedOn)}</span>
                      ) : null}
                      {citizen.notes ? <span className="mt-1 line-clamp-2 block text-sm leading-5">{citizen.notes}</span> : null}
                    </span>
                    <img src="/gaelia/sceau.png" alt="" className="etiquette-seal" />
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
