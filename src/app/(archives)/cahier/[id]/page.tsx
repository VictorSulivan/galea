import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Markdown } from "@/components/markdown";
import { Badge, Button } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { voiceNotes } from "@/lib/db/schema";
import { VOICE_NOTE_KIND, formatDay, formatDate } from "@/lib/format";
import { canVoice } from "@/lib/permissions";
import { deleteVoiceNote } from "@/server/nation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = await getDb().query.voiceNotes.findFirst({ where: eq(voiceNotes.id, id) });
  return { title: note?.title ?? "Rapport" };
}

export default async function VoiceNotePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) redirect("/parvis");
  const { id } = await params;
  const note = await getDb().query.voiceNotes.findFirst({
    where: eq(voiceNotes.id, id),
    with: { author: true },
  });
  if (!note) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/cahier?type=${note.kind}`} className="text-sm text-gold">
          Retour aux {note.kind === "evenement" ? "événements" : "réunions"}
        </Link>
        <Link href={`/cahier/${note.id}/modifier`} className="rounded-full border border-gold/50 px-4 py-2 text-sm text-gold">
          Corriger
        </Link>
      </div>

      <article className="fiche">
        <div className="flex items-start justify-between gap-4">
          <img src="/gaelia/bouclier.png" alt="" className="h-16 w-16" />
          <div className="text-right">
            <Badge tone={note.kind === "reunion" ? "gold" : "leaf"}>{VOICE_NOTE_KIND[note.kind] ?? note.kind}</Badge>
            <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[#8d6b32]">
              {note.occurredOn ? formatDay(note.occurredOn) : formatDate(note.updatedAt)}
            </p>
          </div>
        </div>
        <h1 className="mt-5 font-display text-5xl leading-none text-[#241910]">{note.title}</h1>
        {note.author?.displayName ? (
          <p className="mt-3 text-sm text-[#6b5644]">Noté par {note.author.displayName}</p>
        ) : null}
        <div className="mt-6 font-serif text-lg leading-8 text-[#3c2b20]">
          <Markdown source={note.body} />
        </div>
        <img src="/gaelia/sceau.png" alt="" className="fiche-seal" />
      </article>

      <div className="mt-6">
        <ActionForm action={deleteVoiceNote}>
          <input type="hidden" name="id" value={note.id} />
          <Button type="submit" variant="danger">
            Retirer du cahier
          </Button>
        </ActionForm>
      </div>
    </div>
  );
}
