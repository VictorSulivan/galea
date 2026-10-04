import { asc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PersonForm } from "@/components/person-form";
import { PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { directoryCategories } from "@/lib/db/schema";
import { can } from "@/lib/permissions";

export const metadata = { title: "Nouvelle fiche" };

export default async function NewPersonPage() {
  const user = await getCurrentUser();
  if (!user || !can(user, "annuaire.ecrire")) redirect("/annuaire");
  const categories = await getDb()
    .select({ id: directoryCategories.id, name: directoryCategories.name })
    .from(directoryCategories)
    .orderBy(asc(directoryCategories.sortOrder), asc(directoryCategories.name));
  return (
    <div>
      <PageHeader kicker="Livre des noms" title="Nouvelle étiquette" lede="La catégorie se choisit dans la liste tenue par ceux qui rédigent l’annuaire." />
      <Panel sheet>
        {categories.length === 0 ? (
          <p className="text-ink-soft">
            Aucune catégorie.{" "}
            <Link href="/annuaire/categories" className="text-gold-deep">
              Inscris-en une d’abord.
            </Link>
          </p>
        ) : (
          <PersonForm categories={categories} />
        )}
      </Panel>
    </div>
  );
}
