import Link from "next/link";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Badge, Empty, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users, voiceNotes } from "@/lib/db/schema";
import { VOICE_NOTE_KIND, excerpt, formatDay, formatDate, likeTerm } from "@/lib/format";
import { canVoice } from "@/lib/permissions";

export const metadata = { title: "Cahier interne" };

const KINDS = ["reunion", "evenement"] as const;

function listHref(query: string, type?: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (type) params.set("type", type);
  const search = params.toString();
  return search ? `/cahier?${search}` : "/cahier";
}

export default async function CahierPage({ searchParams }: { searchParams: Promise<{ type?: string; q?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) redirect("/parvis");
  const { type = "", q = "" } = await searchParams;
  const query = q.trim();
  const selected = KINDS.find((kind) => kind === type);
  const db = getDb();
  const filters = [
    selected ? eq(voiceNotes.kind, selected) : undefined,
    query
      ? or(
          ilike(voiceNotes.title, likeTerm(query)),
          ilike(voiceNotes.body, likeTerm(query)),
          ilike(users.displayName, likeTerm(query)),
        )
      : undefined,
  ].filter(Boolean);

  const rows = await db
    .select({
      id: voiceNotes.id,
      kind: voiceNotes.kind,
      title: voiceNotes.title,
      body: voiceNotes.body,
      occurredOn: voiceNotes.occurredOn,
      updatedAt: voiceNotes.updatedAt,
      authorName: users.displayName,
    })
    .from(voiceNotes)
    .leftJoin(users, eq(voiceNotes.authorId, users.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(voiceNotes.occurredOn), desc(voiceNotes.updatedAt));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        kicker="La Voix"
        title="Cahier interne"
        lede="Versions courtes ici. Cherche un titre, un passage ou un scribe, puis ouvre le rapport en entier."
        action={
          <Link href="/cahier/nouveau" className="rounded-full bg-gold px-4 py-2 text-sm text-moss-deep">
            Nouveau rapport
          </Link>
        }
      />
      <form className="mb-5">
        {selected ? <input type="hidden" name="type" value={selected} /> : null}
        <input
          name="q"
          defaultValue={query}
          placeholder="Chercher un titre, un mot du compte rendu, un scribe…"
          className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-parchment outline-none placeholder:text-sap/60"
        />
      </form>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        <Link href={listHref(query)} data-on={selected ? "false" : "true"} className="etiquette-chip shrink-0">
          Tout
        </Link>
        {KINDS.map((kind) => (
          <Link key={kind} href={listHref(query, kind)} data-on={kind === selected ? "true" : "false"} className="etiquette-chip shrink-0">
            {kind === "reunion" ? "Réunions" : "Événements"}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <Empty
          title={query ? "Rien trouvé" : "Cahier vide"}
          text={
            query
              ? "Aucun rapport ne correspond à cette recherche. Essaie un autre mot, ou élargis le filtre."
              : "Le premier rapport de réunion ou d’événement s’écrit depuis le bouton ci-dessus."
          }
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((item) => (
            <Link key={item.id} href={`/cahier/${item.id}`} className="etiquette !items-start">
              <span className="min-w-0 flex-1">
                <span className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone={item.kind === "reunion" ? "gold" : "leaf"}>{VOICE_NOTE_KIND[item.kind] ?? item.kind}</Badge>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[#8d6b32]">
                    {item.occurredOn ? formatDay(item.occurredOn) : formatDate(item.updatedAt)}
                  </span>
                </span>
                <span className="block font-display text-2xl leading-tight text-[#241910]">{item.title}</span>
                <span className="mt-2 block text-sm leading-6 text-[#6b5644]">{excerpt(item.body, 140)}</span>
                {item.authorName ? (
                  <span className="mt-2 block text-[11px] uppercase tracking-[0.14em] text-[#8d6b32]">{item.authorName}</span>
                ) : null}
              </span>
              <img src="/gaelia/sceau.png" alt="" className="etiquette-seal" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
