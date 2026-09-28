import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { CitizenForm } from "@/components/citizen-form";
import { ActionForm } from "@/components/action-form";
import { Button, PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { citizens } from "@/lib/db/schema";
import { can } from "@/lib/permissions";
import { deleteCitizen } from "@/server/nation";

export const metadata = { title: "Membre" };

export default async function CitizenPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !can(user, "zone.recensement")) redirect("/hall");
  const { id } = await params;
  const citizen = await getDb().query.citizens.findFirst({ where: eq(citizens.id, id) });
  if (!citizen) notFound();
  const writable = can(user, "recensement.ecrire");
  const accounts = writable
    ? await getDb().query.users.findMany({
        columns: { id: true, displayName: true, email: true },
        orderBy: (table, operators) => [operators.asc(table.displayName)],
      })
    : [];

  return (
    <div>
      <PageHeader kicker="Recensement" title={citizen.name} lede={citizen.epithet || citizen.grade} />
      <Panel>
        {writable ? (
          <>
            <CitizenForm citizen={citizen} accounts={accounts} />
            <div className="mt-6 border-t border-[#eadcc0] pt-4">
              <ActionForm action={deleteCitizen}>
                <input type="hidden" name="id" value={citizen.id} />
                <Button type="submit" variant="danger">
                  Retirer du recensement
                </Button>
              </ActionForm>
            </div>
          </>
        ) : (
          <div className="font-serif text-lg leading-8">
            <p>{citizen.grade || "Sans grade"}</p>
            {citizen.notes ? <p className="mt-4 whitespace-pre-wrap">{citizen.notes}</p> : null}
          </div>
        )}
      </Panel>
    </div>
  );
}
