import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { LetterEditor } from "@/components/letter-editor";
import { PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { letters } from "@/lib/db/schema";
import { canVoice } from "@/lib/permissions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const letter = await getDb().query.letters.findFirst({ where: eq(letters.id, id) });
  return { title: letter?.subject ?? "Lettre" };
}

export default async function LetterPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) redirect("/parvis");
  const { id } = await params;
  const letter = await getDb().query.letters.findFirst({ where: eq(letters.id, id) });
  if (!letter) notFound();

  return (
    <div>
      <PageHeader
        kicker={letter.status === "published" ? "Déjà sur le Parvis" : "Brouillon"}
        title={letter.subject}
        action={
          <Link href="/lettres" className="text-sm text-gold">
            Toutes les lettres
          </Link>
        }
      />
      <Panel>
        <LetterEditor
          letterId={letter.id}
          initial={{ subject: letter.subject, body: letter.body, status: letter.status }}
        />
      </Panel>
    </div>
  );
}
