import Link from "next/link";
import { and, eq, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import { DecreeSheet } from "@/components/decree-sheet";
import { Markdown } from "@/components/markdown";
import { PublicFrame } from "@/components/public-frame";
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
        Retour aux décrets
      </Link>
      <div className="mt-6 max-w-3xl">
        <DecreeSheet
          reference={decree.reference ?? "Sans numéro"}
          title={decree.title}
          preamble={decree.preamble}
          status={DECREE_STATUS[decree.status] ?? decree.status}
          date={formatDate(decree.publishedAt)}
          issuerRole={decree.issuerRole || undefined}
        >
          <Markdown source={decree.body} />
        </DecreeSheet>
      </div>
    </PublicFrame>
  );
}
