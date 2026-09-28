import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { PersonForm } from "@/components/person-form";
import { ActionForm } from "@/components/action-form";
import { Button, PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { people } from "@/lib/db/schema";
import { can } from "@/lib/permissions";
import { deletePerson } from "@/server/directory";

export const metadata = { title: "Corriger une fiche" };

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !can(user, "annuaire.ecrire")) redirect("/annuaire");
  const { id } = await params;
  const person = await getDb().query.people.findFirst({ where: eq(people.id, id) });
  if (!person) notFound();

  return (
    <div>
      <PageHeader kicker="Annuaire" title={person.name} />
      <Panel>
        <PersonForm person={person} />
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
