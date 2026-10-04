import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { Portrait } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { people } from "@/lib/db/schema";
import { can } from "@/lib/permissions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await getDb().query.people.findFirst({ where: eq(people.id, id), with: { category: true } });
  return { title: person?.name ?? "Fiche" };
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !can(user, "zone.annuaire")) redirect("/hall");
  const { id } = await params;
  const person = await getDb().query.people.findFirst({ where: eq(people.id, id), with: { category: true } });
  if (!person) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/annuaire?categorie=${person.category.id}`} className="text-sm text-gold">
          Retour à {person.category.name}
        </Link>
        {can(user, "annuaire.ecrire") ? (
          <Link href={`/annuaire/${person.id}/modifier`} className="rounded-full border border-gold/50 px-4 py-2 text-sm text-gold">
            Corriger la fiche
          </Link>
        ) : null}
      </div>
      <article className="fiche">
        <div className="flex items-start justify-between gap-4">
          <img src="/gaelia/bouclier.png" alt="" className="h-16 w-16" />
          <p className="text-right text-[11px] uppercase tracking-[0.16em] text-[#8d6b32]">
            <span className="block font-display text-base tracking-[0.2em] text-[#3c2b20]">Catégorie</span>
            {person.category.name}
          </p>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <Portrait storageKey={person.portraitKey} name={person.name} size="h-20 w-20" />
          <div>
            <h1 className="font-display text-5xl leading-none text-[#241910]">{person.name}</h1>
            <p className="mt-2 font-serif text-xl italic text-[#3c2b20]">{person.office}</p>
          </div>
        </div>
        {person.summary ? <p className="mt-5 font-serif text-lg leading-8">{person.summary}</p> : null}
        {person.notes ? (
          <div className="mt-6">
            <Markdown source={person.notes} />
          </div>
        ) : null}
        <img src="/gaelia/sceau.png" alt="" className="fiche-seal" />
      </article>
    </div>
  );
}
