import { asc, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Button, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { directoryCategories, people } from "@/lib/db/schema";
import { can } from "@/lib/permissions";
import { deleteCategory, saveCategory } from "@/server/directory";

export const metadata = { title: "Catégories" };

export default async function CategoriesPage() {
  const user = await getCurrentUser();
  if (!user || !can(user, "annuaire.ecrire")) redirect("/annuaire");
  const db = getDb();
  const [rows, counts] = await Promise.all([
    db.select().from(directoryCategories).orderBy(asc(directoryCategories.sortOrder), asc(directoryCategories.name)),
    db
      .select({ categoryId: people.categoryId, count: sql<number>`count(*)::int` })
      .from(people)
      .groupBy(people.categoryId),
  ]);
  const used = new Map(counts.map((row) => [row.categoryId, Number(row.count)]));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        kicker="Livre des noms"
        title="Catégories"
        lede="Celles qui rédigent l’annuaire tiennent cette liste. Les fiches ne peuvent choisir qu’une catégorie déjà inscrite."
      />
      <Panel sheet>
        <h2 className="font-display text-3xl">Ajouter</h2>
        <div className="mt-4">
          <ActionForm action={saveCategory}>
            <Field label="Nom">
              <input name="name" required className={inputClass} placeholder="Gaélia" />
            </Field>
            <Button type="submit">Inscrire la catégorie</Button>
          </ActionForm>
        </div>
      </Panel>
      <div className="mt-6 grid gap-3">
        {rows.length === 0 ? <p className="text-sap">Aucune catégorie. La première fiche attendra celle-ci.</p> : null}
        {rows.map((category) => (
          <Panel key={category.id} sheet="slip">
            <ActionForm action={saveCategory}>
              <input type="hidden" name="id" value={category.id} />
              <div className="grid gap-3 md:grid-cols-[1fr_7rem_auto] md:items-end">
                <Field label="Nom">
                  <input name="name" required defaultValue={category.name} className={inputClass} />
                </Field>
                <Field label="Ordre">
                  <input name="sortOrder" type="number" defaultValue={category.sortOrder} className={inputClass} />
                </Field>
                <Button type="submit">Enregistrer</Button>
              </div>
            </ActionForm>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-ink-soft">
                {(used.get(category.id) ?? 0) === 0
                  ? "Aucune étiquette"
                  : (used.get(category.id) ?? 0) === 1
                    ? "1 étiquette"
                    : `${used.get(category.id)} étiquettes`}
              </p>
              <ActionForm action={deleteCategory}>
                <input type="hidden" name="id" value={category.id} />
                <Button type="submit" variant="danger">
                  Retirer
                </Button>
              </ActionForm>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
