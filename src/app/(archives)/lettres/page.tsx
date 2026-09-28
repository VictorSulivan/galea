import Link from "next/link";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Badge, Empty, PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { letters } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";
import { canVoice } from "@/lib/permissions";

export const metadata = { title: "Lettres officielles" };

export default async function LettersPage() {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) redirect("/parvis");
  const rows = await getDb().query.letters.findMany({
    with: { author: true },
    orderBy: [desc(letters.updatedAt)],
  });

  return (
    <div>
      <PageHeader
        kicker="La Voix"
        title="Lettres officielles"
        lede="Ce n'est pas un courrier entre membres. Une lettre reste en brouillon, puis le Conseil ou le Gaelor la publie sur le Parvis."
        action={
          <Link href="/lettres/ecrire" className="rounded-full bg-gold px-4 py-2 text-sm text-moss-deep">
            Rédiger
          </Link>
        }
      />
      {rows.length === 0 ? <Empty title="Aucune lettre" text="Le premier texte peut rester en brouillon jusqu'à sa publication." /> : null}
      <div className="grid gap-3">
        {rows.map((letter) => (
          <Link key={letter.id} href={`/lettres/${letter.id}`}>
            <Panel className="flex items-center justify-between gap-4 !p-4">
              <div>
                <p className="font-display text-2xl">{letter.subject}</p>
                <p className="text-sm text-ink-soft">{letter.author?.displayName ?? "Inconnu"}</p>
              </div>
              <div className="text-right text-sm text-ink-soft">
                <Badge tone={letter.status === "published" ? "leaf" : "gold"}>
                  {letter.status === "published" ? "Sur le Parvis" : "Brouillon"}
                </Badge>
                <p className="mt-1">{formatDate(letter.publishedAt ?? letter.updatedAt)}</p>
              </div>
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  );
}
