import { ActionForm } from "@/components/action-form";
import { Badge, Button, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { describeGrant, grantLabel, levelLabel, type Sensitivity } from "@/lib/permissions";
import { updateIdentity, updatePassword } from "@/server/session";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { shelves } from "@/lib/db/schema";

export const metadata = { title: "Mon sceau" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  const shelfRows = await getDb().select().from(shelves).orderBy(asc(shelves.sortOrder));
  const refs = shelfRows.map((shelf) => ({
    slug: shelf.slug,
    name: shelf.name,
    sensitivity: shelf.sensitivity as Sensitivity,
  }));

  return (
    <div>
      <PageHeader kicker="Toi" title="Mon sceau" lede="Ton nom dans les archives, et ce que chaque porte te permet vraiment." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel sheet>
          <h2 className="font-display text-3xl">Identité</h2>
          <div className="mt-4">
            <ActionForm action={updateIdentity}>
              <Field label="Nom">
                <input name="displayName" required defaultValue={user.displayName} className={inputClass} />
              </Field>
              <Field label="Titre">
                <input name="title" defaultValue={user.title ?? ""} className={inputClass} />
              </Field>
              <Button type="submit">Enregistrer</Button>
            </ActionForm>
          </div>
          {user.discordUsername ? (
            <p className="mt-4 text-sm text-ink-soft">Connecté via Discord @{user.discordUsername}</p>
          ) : null}
          {user.hasPassword ? (
            <>
              <h2 className="mt-8 font-display text-3xl">Mot de passe</h2>
              <div className="mt-4">
                <ActionForm action={updatePassword}>
                  <Field label="Actuel">
                    <input name="current" type="password" required className={inputClass} />
                  </Field>
                  <Field label="Nouveau">
                    <input name="next" type="password" required minLength={8} className={inputClass} />
                  </Field>
                  <Field label="Confirmation">
                    <input name="confirm" type="password" required minLength={8} className={inputClass} />
                  </Field>
                  <Button type="submit" variant="ghost">
                    Changer
                  </Button>
                </ActionForm>
              </div>
            </>
          ) : (
            <p className="mt-8 text-sm text-ink-soft">Pas de mot de passe : tu entres uniquement par Discord.</p>
          )}
        </Panel>
        <Panel>
          <h2 className="font-display text-3xl">Portes ouvertes</h2>
          {user.isSuperAdmin ? <p className="mt-2 text-sm text-ink-soft">Gardien technique : toutes les portes restent ouvertes.</p> : null}
          <div className="mt-4 grid gap-3">
            {user.grants.length === 0 && !user.isSuperAdmin ? <p className="text-ink-soft">Aucun degré n’est ouvert pour l’instant.</p> : null}
            {user.isSuperAdmin ? <Badge>Accès total · degré 5</Badge> : null}
            {(user.isSuperAdmin ? [] : user.grants)
              .slice()
              .sort((a, b) => a.key.localeCompare(b.key, "fr"))
              .map((grant) => (
                <div key={grant.key} className="rounded-2xl border border-white/10 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-xl">{grantLabel(grant.key, refs)}</p>
                    <Badge>{levelLabel(grant.level)}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink-soft">{describeGrant(grant.key, grant.level, refs)}</p>
                </div>
              ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
