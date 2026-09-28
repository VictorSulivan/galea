import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { PageHeader, Panel, Portrait } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { people } from "@/lib/db/schema";
import { can } from "@/lib/permissions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await getDb().query.people.findFirst({ where: eq(people.id, id) });
  return { title: person?.name ?? "Fiche" };
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !can(user, "zone.annuaire")) redirect("/hall");
  const { id } = await params;
  const person = await getDb().query.people.findFirst({ where: eq(people.id, id) });
  if (!person) notFound();

  return (
    <div>
      <PageHeader
        kicker={person.nation}
        title={person.name}
        lede={person.office}
        action={
          can(user, "annuaire.ecrire") ? (
            <Link href={`/annuaire/${person.id}/modifier`} className="rounded-full border border-gold/50 px-4 py-2 text-sm text-gold">
              Corriger la fiche
            </Link>
          ) : null
        }
      />
      <Panel>
        <div className="flex gap-5">
          <Portrait storageKey={person.portraitKey} name={person.name} size="h-28 w-28" />
          <p className="font-serif text-xl leading-8">{person.summary}</p>
        </div>
        {person.notes ? (
          <div className="mt-8">
            <Markdown source={person.notes} />
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
