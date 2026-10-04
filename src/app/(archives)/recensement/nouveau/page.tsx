import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { CitizenForm } from "@/components/citizen-form";
import { PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { citizenGrades, citizens } from "@/lib/db/schema";
import { can } from "@/lib/permissions";

export const metadata = { title: "Inscrire un membre" };

export default async function NewCitizenPage() {
  const user = await getCurrentUser();
  if (!user || !can(user, "recensement.ecrire")) redirect("/recensement");
  const db = getDb();
  const [accounts, grades, superiors] = await Promise.all([
    db.query.users.findMany({
      columns: { id: true, displayName: true, username: true },
      orderBy: (table, operators) => [operators.asc(table.displayName)],
    }),
    db.select().from(citizenGrades).orderBy(asc(citizenGrades.sortOrder), asc(citizenGrades.name)),
    db.select({ id: citizens.id, name: citizens.name }).from(citizens).orderBy(asc(citizens.name)),
  ]);
  return (
    <div>
      <PageHeader kicker="Recensement" title="Inscrire un membre" lede="Le compte du site est facultatif : on peut recenser quelqu'un avant de lui ouvrir un sceau." />
      <Panel sheet>
        {grades.length === 0 ? (
          <p className="font-serif text-ink-soft">
            Aucun grade n’est encore défini.{" "}
            <a href="/recensement/grades" className="text-gold underline decoration-gold/40">
              Créer les grades
            </a>{" "}
            avant d’inscrire un membre.
          </p>
        ) : (
          <CitizenForm accounts={accounts} grades={grades} superiors={superiors} />
        )}
      </Panel>
    </div>
  );
}
