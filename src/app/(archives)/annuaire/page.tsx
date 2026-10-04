import Link from "next/link";
import { asc, desc, eq, ilike, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Empty, PageHeader, Portrait } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { directoryCategories, people } from "@/lib/db/schema";
import { likeTerm } from "@/lib/format";
import { can } from "@/lib/permissions";

export const metadata = { title: "Annuaire" };

function listHref(query: string, categorie?: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (categorie) params.set("categorie", categorie);
  const search = params.toString();
  return search ? `/annuaire?${search}` : "/annuaire";
}

export default async function AnnuairePage({ searchParams }: { searchParams: Promise<{ q?: string; categorie?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !can(user, "zone.annuaire")) redirect("/hall");
  const { q = "", categorie = "" } = await searchParams;
  const query = q.trim();
  const category = categorie.trim();
  const db = getDb();
  const [rows, categories] = await Promise.all([
    db
      .select({
        id: people.id,
        name: people.name,
        office: people.office,
        summary: people.summary,
        portraitKey: people.portraitKey,
        featured: people.featured,
        categoryId: people.categoryId,
        categoryName: directoryCategories.name,
      })
      .from(people)
      .innerJoin(directoryCategories, eq(people.categoryId, directoryCategories.id))
      .where(
        query
          ? or(ilike(people.name, likeTerm(query)), ilike(directoryCategories.name, likeTerm(query)), ilike(people.office, likeTerm(query)))
          : undefined,
      )
      .orderBy(desc(people.featured), asc(people.name)),
    db.select().from(directoryCategories).orderBy(asc(directoryCategories.sortOrder), asc(directoryCategories.name)),
  ]);
  const selected = categories.find((item) => item.id === category);
  const visible = selected ? rows.filter((person) => person.categoryId === selected.id) : rows;
  const groups = new Map<string, typeof visible>();
  for (const person of visible) {
    const list = groups.get(person.categoryId) ?? [];
    list.push(person);
    groups.set(person.categoryId, list);
  }
  const ordered = categories.filter((item) => !selected || item.id === selected.id);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        kicker="Livre des noms"
        title="Annuaire"
        lede="Les étiquettes de la table, rangées dans l’ordre des catégories."
        action={
          can(user, "annuaire.ecrire") ? (
            <div className="flex gap-2">
              <Link href="/annuaire/categories" className="rounded-full border border-gold/40 px-4 py-2 text-sm text-gold">
                Catégories
              </Link>
              <Link href="/annuaire/nouveau" className="rounded-full bg-gold px-4 py-2 text-sm text-moss-deep">
                Nouvelle étiquette
              </Link>
            </div>
          ) : null
        }
      />
      <form className="mb-5">
        {selected ? <input type="hidden" name="categorie" value={selected.id} /> : null}
        <input
          name="q"
          defaultValue={query}
          placeholder="Chercher un nom, une fonction, une catégorie"
          className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-parchment outline-none placeholder:text-sap/60"
        />
      </form>
      <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
        <Link href={listHref(query)} data-on={selected ? "false" : "true"} className="etiquette-chip shrink-0">
          Toutes
        </Link>
        {categories.map((item) => (
          <Link
            key={item.id}
            href={listHref(query, item.id)}
            data-on={item.id === selected?.id ? "true" : "false"}
            className="etiquette-chip shrink-0"
          >
            {item.name}
          </Link>
        ))}
      </div>
      {visible.length === 0 ? (
        <Empty title="Aucune étiquette" text="Cette catégorie ne porte encore aucun nom, ou la recherche n’a rien reconnu." />
      ) : null}
      <div className="grid gap-10">
        {ordered.map((item) => {
          const peopleInCategory = groups.get(item.id) ?? [];
          if (peopleInCategory.length === 0 && query) return null;
          return (
            <section key={item.id}>
              <header className="mb-4 flex items-end justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src="/gaelia/bouclier.png" alt="" className="h-12 w-12" />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-gold">Catégorie</p>
                    <h2 className="font-display text-3xl text-parchment">{item.name}</h2>
                  </div>
                </div>
                <p className="text-xs uppercase tracking-[0.16em] text-sap">
                  {peopleInCategory.length > 1 ? `${peopleInCategory.length} étiquettes` : peopleInCategory.length === 1 ? "1 étiquette" : "Aucune étiquette"}
                </p>
              </header>
              <div className="grid gap-3 md:grid-cols-2">
                {peopleInCategory.map((person) => (
                  <Link key={person.id} href={`/annuaire/${person.id}`} className="etiquette">
                    <Portrait storageKey={person.portraitKey} name={person.name} size="h-14 w-14" />
                    <span className="min-w-0">
                      <span className="block font-display text-2xl leading-tight">{person.name}</span>
                      <span className="block text-sm text-[#6b5644]">{person.office}</span>
                      {person.featured ? <span className="mt-1 block text-[11px] uppercase tracking-[0.14em] text-[#8d6b32]">Marquée à la table</span> : null}
                      {person.summary ? <span className="mt-1 line-clamp-2 block text-sm leading-5">{person.summary}</span> : null}
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
