import { asc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { PersonForm } from "@/components/person-form";
import { ActionForm } from "@/components/action-form";
import { Button, PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { directoryCategories, people } from "@/lib/db/schema";
import { can } from "@/lib/permissions";
import { deletePerson } from "@/server/directory";

export const metadata = { title: "Corriger une fiche" };

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !can(user, "annuaire.ecrire")) redirect("/annuaire");
  const { id } = await params;
  const db = getDb();
  const [person, categories] = await Promise.all([
    db.query.people.findFirst({ where: eq(people.id, id) }),
    db
      .select({ id: directoryCategories.id, name: directoryCategories.name })
      .from(directoryCategories)
      .orderBy(asc(directoryCategories.sortOrder), asc(directoryCategories.name)),
  ]);
  if (!person) notFound();

  return (
    <div>
      <PageHeader kicker="Annuaire" title={person.name} />
      <Panel sheet>
        <PersonForm person={person} categories={categories} />
        <div className="mt-6 border-t border-[#eadcc0] pt-4">
          <ActionForm action={deletePerson}>
            <input type="hidden" name="id" value={person.id} />
            <Button type="submit" variant="danger">
              Retirer la fiche
            </Button>
          </ActionForm>
        </div>
      </Panel>
    </div>
  );
}
