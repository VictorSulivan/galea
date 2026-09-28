import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { decrees, users } from "@/lib/db/schema";
import { DECREE_STATUS, formatDate } from "@/lib/format";
import { canVoice } from "@/lib/permissions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decree = await getDb().query.decrees.findFirst({ where: eq(decrees.id, id) });
  return { title: decree?.title ?? "Décret" };
}

export default async function DecreePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) redirect("/parvis");
  const { id } = await params;
  const decree = await getDb().query.decrees.findFirst({ where: eq(decrees.id, id) });
  if (!decree) notFound();
  const author = decree.authorId
    ? await getDb().query.users.findFirst({ where: eq(users.id, decree.authorId), columns: { displayName: true } })
    : null;

  return (
    <div>
      <PageHeader
        kicker={decree.reference ?? "Brouillon"}
        title={decree.title}
        lede={decree.preamble}
        action={
          <Link href={`/decrets/${decree.id}/modifier`} className="rounded-full border border-gold/50 px-4 py-2 text-sm text-gold">
            Reprendre
          </Link>
        }
      />
      <div className="mb-4 flex gap-3 text-sm text-sap">
        <Badge tone={decree.status === "published" ? "leaf" : decree.status === "repealed" ? "clay" : "gold"}>
          {DECREE_STATUS[decree.status] ?? decree.status}
        </Badge>
        <span>{author?.displayName ?? "Scribe inconnu"}</span>
        <span>{formatDate(decree.publishedAt ?? decree.createdAt)}</span>
      </div>
      <Panel>
        <Markdown source={decree.body} />
      </Panel>
    </div>
  );
}
