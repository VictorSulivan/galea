import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { VoiceNoteForm } from "@/components/voice-note-form";
import { PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { voiceNotes } from "@/lib/db/schema";
import { canVoice } from "@/lib/permissions";

export const metadata = { title: "Corriger un rapport" };

export default async function EditVoiceNotePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) redirect("/parvis");
  const { id } = await params;
  const note = await getDb().query.voiceNotes.findFirst({ where: eq(voiceNotes.id, id) });
  if (!note) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link href={`/cahier/${note.id}`} className="text-sm text-gold">
          Retour au rapport
        </Link>
      </div>
      <PageHeader kicker="Cahier interne" title="Corriger la feuille" lede={note.title} />
      <div className="form-sheet">
        <VoiceNoteForm note={note} />
      </div>
    </div>
  );
}
