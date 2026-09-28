import Link from "next/link";
import { and, eq, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { PublicFrame } from "@/components/public-frame";
import { Badge } from "@/components/ui";
import { getDb } from "@/lib/db";
import { decrees } from "@/lib/db/schema";
import { DECREE_STATUS, formatDate } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decree = await getDb().query.decrees.findFirst({ where: eq(decrees.id, id) });
  return { title: decree?.title ?? "Décret" };
}

export default async function PublicDecreePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decree = await getDb().query.decrees.findFirst({
    where: and(eq(decrees.id, id), or(eq(decrees.status, "published"), eq(decrees.status, "repealed"))),
  });
  if (!decree) notFound();

  return (
    <PublicFrame>
      <Link href="/parvis" className="text-sm text-gold">
        Retour au Parvis
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone={decree.status === "published" ? "leaf" : "clay"}>{DECREE_STATUS[decree.status] ?? decree.status}</Badge>
        <span className="text-sm text-gold">{decree.reference}</span>
        <span className="text-sm text-sap">{formatDate(decree.publishedAt)}</span>
      </div>
      <h1 className="mt-3 max-w-3xl font-display text-5xl">{decree.title}</h1>
      {decree.preamble ? <p className="mt-4 max-w-2xl text-lg text-sap">{decree.preamble}</p> : null}
      <article className="parchment mt-8 max-w-3xl rounded-[1.8rem] px-6 py-7">
        <Markdown source={decree.body} />
      </article>
    </PublicFrame>
  );
}
