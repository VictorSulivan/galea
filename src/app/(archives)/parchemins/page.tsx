import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Markdown } from "@/components/markdown";
import { MarkdownField } from "@/components/markdown-field";
import { Badge, Button, Empty, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parchments } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";
import { canVoice } from "@/lib/permissions";
import { deleteParchment, saveParchment } from "@/server/nation";

export const metadata = { title: "Parchemins" };

export default async function ParchmentsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) redirect("/parvis");
  const { id = "" } = await searchParams;
  const rows = await getDb().select().from(parchments).orderBy(desc(parchments.pinned), desc(parchments.publishedAt));
  const current = rows.find((item) => item.id === id) ?? null;

  return (
    <div>
      <PageHeader kicker="Annonces" title="Parchemins" lede="Annonces du Conseil et du Gaelor. Une fois affichées, elles se lisent sur le Parvis." />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel>
            <h2 className="font-display text-3xl">{current ? "Corriger" : "Nouveau parchemin"}</h2>
            <div className="mt-4">
              <ActionForm action={saveParchment}>
                <input type="hidden" name="id" value={current?.id ?? ""} />
                <Field label="Titre">
                  <input name="title" required defaultValue={current?.title} className={inputClass} />
                </Field>
                <MarkdownField name="body" label="Texte" defaultValue={current?.body} usage="piece" rows={10} />
                <Field label="État">
                  <select name="status" defaultValue={current?.status ?? "draft"} className={inputClass}>
                    <option value="draft">Brouillon</option>
                    <option value="published">Afficher sur le Parvis</option>
                  </select>
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="pinned" defaultChecked={current?.pinned} />
                  Épingler en tête du Parvis
                </label>
                <Button type="submit">Enregistrer</Button>
              </ActionForm>
            </div>
            {current ? (
              <div className="mt-4">
                <ActionForm action={deleteParchment}>
                  <input type="hidden" name="id" value={current.id} />
                  <Button type="submit" variant="danger">
                    Retirer
                  </Button>
                </ActionForm>
              </div>
            ) : null}
          </Panel>
        <div className="grid gap-4">
          {rows.length === 0 ? <Empty title="Aucun avis" text="Les parchemins apparaissent ici, et les épinglés remontent dans le Hall." /> : null}
          {rows.map((item) => (
            <article key={item.id} id={item.id} className="parchment rounded-[1.8rem] px-6 py-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-gold-deep">{formatDate(item.publishedAt)}</p>
                {item.status === "published" ? <Badge tone="leaf">Sur le Parvis</Badge> : <Badge>Brouillon</Badge>}
                {item.pinned ? <Badge>Épinglé</Badge> : null}
              </div>
              <h2 className="mt-2 font-display text-4xl">{item.title}</h2>
              <Markdown source={item.body} />
              <a href={`/parchemins?id=${item.id}`} className="text-sm text-gold-deep">
                  Corriger
              </a>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
