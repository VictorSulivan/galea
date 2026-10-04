import { asc, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Button, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { citizenGrades, citizens } from "@/lib/db/schema";
import { can } from "@/lib/permissions";
import { deleteGrade, saveGrade } from "@/server/nation";

export const metadata = { title: "Grades" };

export default async function GradesPage() {
  const user = await getCurrentUser();
  if (!user || !can(user, "recensement.ecrire")) redirect("/recensement");
  const db = getDb();
  const [rows, counts] = await Promise.all([
    db.select().from(citizenGrades).orderBy(asc(citizenGrades.sortOrder), asc(citizenGrades.name)),
    db
      .select({ gradeId: citizens.gradeId, count: sql<number>`count(*)::int` })
      .from(citizens)
      .groupBy(citizens.gradeId),
  ]);
  const used = new Map(counts.map((row) => [row.gradeId, Number(row.count)]));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        kicker="La nation"
        title="Grades"
        lede="Ceux qui tiennent le recensement définissent cette liste. Chaque membre choisit un grade déjà inscrit."
      />
      <Panel sheet>
        <h2 className="font-display text-3xl">Ajouter</h2>
        <div className="mt-4">
          <ActionForm action={saveGrade}>
            <Field label="Nom">
              <input name="name" required className={inputClass} placeholder="Sentinelle" />
            </Field>
            <Button type="submit">Inscrire le grade</Button>
          </ActionForm>
        </div>
      </Panel>
      <div className="mt-6 grid gap-3">
        {rows.length === 0 ? <p className="text-sap">Aucun grade. Le premier membre attendra celui-ci.</p> : null}
        {rows.map((grade) => (
          <Panel key={grade.id} sheet="slip">
            <ActionForm action={saveGrade}>
              <input type="hidden" name="id" value={grade.id} />
              <div className="grid gap-3 md:grid-cols-[1fr_7rem_auto] md:items-end">
                <Field label="Nom">
                  <input name="name" required defaultValue={grade.name} className={inputClass} />
                </Field>
                <Field label="Ordre">
                  <input name="sortOrder" type="number" defaultValue={grade.sortOrder} className={inputClass} />
                </Field>
                <Button type="submit">Enregistrer</Button>
              </div>
            </ActionForm>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-ink-soft">
                {(used.get(grade.id) ?? 0) === 0
                  ? "Aucun membre"
                  : (used.get(grade.id) ?? 0) === 1
                    ? "1 membre"
                    : `${used.get(grade.id)} membres`}
              </p>
              <ActionForm action={deleteGrade}>
                <input type="hidden" name="id" value={grade.id} />
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
