import { redirect } from "next/navigation";
import { PersonForm } from "@/components/person-form";
import { PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export const metadata = { title: "Nouvelle fiche" };

export default async function NewPersonPage() {
  const user = await getCurrentUser();
  if (!user || !can(user, "annuaire.ecrire")) redirect("/annuaire");
  return (
    <div>
      <PageHeader kicker="Annuaire" title="Nouvelle fiche" lede="Une personne importante du serveur, qu'elle soit de Gaélia ou d'ailleurs." />
      <Panel>
        <PersonForm />
      </Panel>
    </div>
  );
}
