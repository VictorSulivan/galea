import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { PublicFrame } from "@/components/public-frame";
import { getDb } from "@/lib/db";
import { letters } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const letter = await getDb().query.letters.findFirst({ where: eq(letters.id, id) });
  return { title: letter?.subject ?? "Lettre" };
}

export default async function PublicLetterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const letter = await getDb().query.letters.findFirst({
    where: and(eq(letters.id, id), eq(letters.status, "published")),
    with: { author: true },
  });
  if (!letter) notFound();

  return (
    <PublicFrame>
      <Link href="/parvis" className="text-sm text-gold">
        Retour à l’espace public
      </Link>
      <p className="mt-4 text-sm text-gold">
        {letter.author?.displayName ?? "La nation"}
        {letter.author?.title ? ` · ${letter.author.title}` : ""} · {formatDate(letter.publishedAt)}
      </p>
      <h1 className="mt-2 max-w-3xl font-display text-5xl">{letter.subject}</h1>
      <article className="parchment mt-8 max-w-3xl rounded-[1.8rem] px-6 py-7">
        <Markdown source={letter.body} />
      </article>
    </PublicFrame>
  );
}
