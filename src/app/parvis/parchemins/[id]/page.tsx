import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { PublicFrame } from "@/components/public-frame";
import { Badge } from "@/components/ui";
import { getDb } from "@/lib/db";
import { parchments } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getDb().query.parchments.findFirst({ where: eq(parchments.id, id) });
  return { title: item?.title ?? "Parchemin" };
}

export default async function PublicParchmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getDb().query.parchments.findFirst({
    where: and(eq(parchments.id, id), eq(parchments.status, "published")),
  });
  if (!item) notFound();

  return (
    <PublicFrame>
      <Link href="/parvis" className="text-sm text-gold">
        Retour au Parvis
      </Link>
      <article className="parchment mt-6 max-w-3xl rounded-[1.8rem] px-6 py-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-gold-deep">{formatDate(item.publishedAt)}</p>
          {item.pinned ? <Badge>Épinglé</Badge> : null}
        </div>
        <h1 className="mt-2 font-display text-5xl text-ink">{item.title}</h1>
        <Markdown source={item.body} />
      </article>
    </PublicFrame>
  );
}
