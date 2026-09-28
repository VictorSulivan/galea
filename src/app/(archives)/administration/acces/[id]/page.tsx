import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { PermissionEditor } from "@/components/permission-editor";
import { Button, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { shelves, users } from "@/lib/db/schema";
import { can, type Sensitivity } from "@/lib/permissions";
import { resetAccessPassword, saveAccess } from "@/server/access";
import { asc } from "drizzle-orm";

export const metadata = { title: "Droits" };

export default async function AccountRightsPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentUser();
  if (!actor || !can(actor, "acces.gerer")) redirect("/administration/acces");
  const { id } = await params;
  const account = await getDb().query.users.findFirst({ where: eq(users.id, id), with: { grants: true } });
  if (!account) notFound();
  const shelfRows = await getDb().select().from(shelves).orderBy(asc(shelves.sortOrder));
  const refs = shelfRows.map((shelf) => ({
    slug: shelf.slug,
    name: shelf.name,
    sensitivity: shelf.sensitivity as Sensitivity,
  }));

  return (
    <div>
      <PageHeader kicker={account.email} title={account.displayName} lede={account.title ?? "Sans titre"} />
      {account.isSuperAdmin ? (
        <p className="mb-4 rounded-2xl border border-gold/40 px-4 py-3 text-sm text-gold">
          Ce gardien technique garde l’accès total, pour qu’on ne puisse pas fermer les archives à clé. Les degrés ci-dessous servent de mémoire, ils ne le verrouillent pas.
        </p>
      ) : null}
      <Panel>
        <PermissionEditor action={saveAccess} shelves={refs} initial={account.grants.map((grant) => ({ key: grant.key, level: grant.level }))} submitLabel="Enregistrer les degrés">
          <input type="hidden" name="id" value={account.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom">
              <input name="displayName" required defaultValue={account.displayName} className={inputClass} />
            </Field>
            <Field label="Titre">
              <input name="title" defaultValue={account.title ?? ""} className={inputClass} />
            </Field>
          </div>
          {account.isSuperAdmin ? null : (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={account.active} />
              Compte actif
            </label>
          )}
        </PermissionEditor>
      </Panel>
      <Panel className="mt-6">
        <h2 className="font-display text-2xl">Nouveau mot de passe</h2>
        <div className="mt-4">
          <ActionForm action={resetAccessPassword}>
            <input type="hidden" name="id" value={account.id} />
            <Field label="Mot de passe">
              <input name="password" type="password" required minLength={8} className={inputClass} />
            </Field>
            <Button type="submit" variant="ghost">
              Confier ce mot de passe
            </Button>
          </ActionForm>
        </div>
      </Panel>
    </div>
  );
}
