import Link from "next/link";
import { redirect } from "next/navigation";
import { VoiceNoteForm } from "@/components/voice-note-form";
import { PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { canVoice } from "@/lib/permissions";

export const metadata = { title: "Nouveau rapport" };

export default async function NewVoiceNotePage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) redirect("/parvis");
  const { type = "reunion" } = await searchParams;
  const kind = type === "evenement" ? "evenement" : "reunion";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link href="/cahier" className="text-sm text-gold">
          Retour au cahier
        </Link>
      </div>
      <PageHeader
        kicker="Cahier interne"
        title={kind === "evenement" ? "Noter un événement" : "Rédiger un rapport"}
        lede={
          kind === "evenement"
            ? "Ce qui arrive à la nation et doit rester en mémoire du Conseil — sans passer par le Parvis."
            : "Le compte rendu d’une réunion du Gaelor ou du Conseil. Il reste dans l’espace privé."
        }
      />
      <div className="form-sheet">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold-deep">Note interne</p>
            <h2 className="mt-1 font-display text-3xl text-ink">Feuille du cahier</h2>
          </div>
          <img src="/gaelia/bouclier.png" alt="" className="h-14 w-14 shrink-0" />
        </div>
        <VoiceNoteForm defaultKind={kind} />
      </div>
    </div>
  );
}
