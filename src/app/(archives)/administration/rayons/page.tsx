import { asc, like } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Badge, Button, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { grants, shelves } from "@/lib/db/schema";
import { SENSITIVITY } from "@/lib/format";
import { can } from "@/lib/permissions";
import { saveShelf } from "@/server/library";

export const metadata = { title: "Rayons" };

export default async function ShelvesPage() {
  const user = await getCurrentUser();
  if (!user || !can(user, "rayons.gerer")) redirect("/administration");
  const db = getDb();
  const rows = await db.select().from(shelves).orderBy(asc(shelves.sortOrder));
  const grantRows = await db.select().from(grants).where(like(grants.key, "rayon.%"));

  return (
    <div>
      <PageHeader
        kicker="Bibliothèque"
        title="Rayons"
        lede="Un rayon neuf n'est visible pour personne. Il apparaît dans la checklist, et tu coches qui peut le lire ou l'écrire."
      />
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel>
          <h2 className="font-display text-3xl">Nouveau rayon</h2>
          <div className="mt-4">
            <ActionForm action={saveShelf}>
              <Field label="Nom">
                <input name="name" required className={inputClass} />
              </Field>
              <Field label="Description">
                <textarea name="description" rows={4} className={inputClass} />
              </Field>
              <Field label="Sensibilité">
                <select name="sensitivity" defaultValue="restreint" className={inputClass}>
                  <option value="ouvert">Ouvert</option>
                  <option value="restreint">Restreint</option>
                  <option value="secret">Secret</option>
                </select>
              </Field>
              <Button type="submit">Créer le rayon</Button>
            </ActionForm>
          </div>
        </Panel>
        <div className="grid gap-3">
          {rows.map((shelf) => {
            const readers = new Set(grantRows.filter((grant) => grant.key === `rayon.${shelf.slug}.lire`).map((grant) => grant.userId));
            return (
              <Panel key={shelf.id} className="!p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-2xl">{shelf.name}</h2>
                  <Badge tone={shelf.sensitivity === "secret" ? "clay" : shelf.sensitivity === "ouvert" ? "leaf" : "gold"}>
                    {SENSITIVITY[shelf.sensitivity] ?? shelf.sensitivity}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-ink-soft">{shelf.description}</p>
                <p className="mt-2 text-xs text-gold-deep">{readers.size} lecture{readers.size > 1 ? "s" : ""} cochée{readers.size > 1 ? "s" : ""}</p>
              </Panel>
            );
          })}
        </div>
      </div>
    </div>
  );
}
