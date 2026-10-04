import { redirect } from "next/navigation";
import { PermissionEditor } from "@/components/permission-editor";
import { Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { presetGrants, can, type Sensitivity } from "@/lib/permissions";
import { createAccount } from "@/server/access";
import { asc } from "drizzle-orm";
import { shelves } from "@/lib/db/schema";

export const metadata = { title: "Nouveau compte" };

export default async function NewAccountPage() {
  const user = await getCurrentUser();
  if (!user || !can(user, "acces.gerer")) redirect("/administration/acces");
  const shelfRows = await getDb().select().from(shelves).orderBy(asc(shelves.sortOrder));
  const refs = shelfRows.map((shelf) => ({
    slug: shelf.slug,
    name: shelf.name,
    sensitivity: shelf.sensitivity as Sensitivity,
  }));

  return (
    <div>
      <PageHeader
        kicker="Sceaux"
        title="Ouvrir un compte"
        lede="Commence par un modèle (Citoyen, Conseil…). Ensuite chaque porte explique ce que le degré choisi permet — y compris sur les listes administrables."
      />
      <Panel sheet>
        <PermissionEditor action={createAccount} shelves={refs} initial={presetGrants("citoyen", refs)} submitLabel="Créer le compte">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom">
              <input name="displayName" required className={inputClass} />
            </Field>
            <Field label="Titre">
              <input name="title" className={inputClass} placeholder="Gardien des semis" />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom d’utilisateur">
              <input name="username" required autoComplete="off" className={inputClass} placeholder="seve" />
            </Field>
            <Field label="Mot de passe provisoire">
              <input name="password" type="password" required minLength={8} className={inputClass} />
            </Field>
          </div>
        </PermissionEditor>
      </Panel>
    </div>
  );
}
