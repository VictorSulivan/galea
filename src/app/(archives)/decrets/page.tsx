import Link from "next/link";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Badge, Empty, PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { decrees } from "@/lib/db/schema";
import { DECREE_STATUS, formatDate } from "@/lib/format";
import { canVoice } from "@/lib/permissions";

export const metadata = { title: "Décrets" };

export default async function DecreesPage() {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) redirect("/parvis");
  const rows = await getDb().select().from(decrees).orderBy(desc(decrees.updatedAt));
  const visible = rows;

  return (
    <div>
      <PageHeader
        kicker="La voix de la nation"
        title="Décrets"
        lede="Brouillons, promulgations, abrogations. Le numéro GAE est donné quand le texte est posé sur le Parvis."
        action={
          <Link href="/decrets/nouveau" className="rounded-full bg-gold px-4 py-2 text-sm text-moss-deep">
            Rédiger
          </Link>
        }
      />
      {visible.length === 0 ? <Empty title="Aucun décret" text="Le premier texte peut rester en brouillon jusqu'à ce qu'un sceau autorisé le promulgue." /> : null}
      <div className="grid gap-4">
        {visible.map((decree) => (
          <Link key={decree.id} href={`/decrets/${decree.id}`}>
            <Panel>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={decree.status === "published" ? "leaf" : decree.status === "repealed" ? "clay" : "gold"}>
                  {DECREE_STATUS[decree.status] ?? decree.status}
                </Badge>
                <span className="text-xs text-gold-deep">{decree.reference ?? "Sans numéro"}</span>
                <span className="text-xs text-ink-soft">{formatDate(decree.publishedAt ?? decree.updatedAt)}</span>
              </div>
              <h2 className="mt-2 font-display text-3xl">{decree.title}</h2>
              {decree.preamble ? <p className="mt-2 text-sm text-ink-soft">{decree.preamble}</p> : null}
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  );
}
