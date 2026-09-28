import { redirect } from "next/navigation";
import { CitizenForm } from "@/components/citizen-form";
import { PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { can } from "@/lib/permissions";

export const metadata = { title: "Inscrire un membre" };

export default async function NewCitizenPage() {
  const user = await getCurrentUser();
  if (!user || !can(user, "recensement.ecrire")) redirect("/recensement");
  const accounts = await getDb().query.users.findMany({
    columns: { id: true, displayName: true, email: true },
    orderBy: (table, operators) => [operators.asc(table.displayName)],
  });
  return (
    <div>
      <PageHeader kicker="Recensement" title="Inscrire un membre" lede="Le compte du site est facultatif : on peut recenser quelqu'un avant de lui ouvrir un sceau." />
      <Panel>
        <CitizenForm accounts={accounts} />
      </Panel>
    </div>
  );
}
