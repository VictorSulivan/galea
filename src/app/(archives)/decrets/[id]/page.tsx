import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { DecreeSheet } from "@/components/decree-sheet";
import { Markdown } from "@/components/markdown";
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
    <div className="max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-sap">{author?.displayName ?? "Scribe inconnu"}</p>
        <Link href={`/decrets/${decree.id}/modifier`} className="rounded-full border border-gold/50 px-4 py-2 text-sm text-gold">
          Reprendre
        </Link>
      </div>
      <DecreeSheet
        reference={decree.reference ?? "Sans numéro"}
        title={decree.title}
        preamble={decree.preamble}
        status={DECREE_STATUS[decree.status] ?? decree.status}
        date={formatDate(decree.publishedAt ?? decree.createdAt)}
        issuerRole={decree.issuerRole || undefined}
      >
        <Markdown source={decree.body} />
      </DecreeSheet>
    </div>
  );
}
