import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { CitizenForm } from "@/components/citizen-form";
import { ActionForm } from "@/components/action-form";
import { Button, Portrait } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { citizenGrades, citizens } from "@/lib/db/schema";
import { CITIZEN_STATUS, formatDay } from "@/lib/format";
import { can } from "@/lib/permissions";
import { deleteCitizen } from "@/server/nation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const citizen = await getDb().query.citizens.findFirst({ where: eq(citizens.id, id) });
  return { title: citizen?.name ?? "Membre" };
}

export default async function CitizenPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !can(user, "zone.recensement")) redirect("/hall");
  const { id } = await params;
  const citizen = await getDb().query.citizens.findFirst({
    where: eq(citizens.id, id),
    with: { grade: true, superior: true },
  });
  if (!citizen) notFound();
  const writable = can(user, "recensement.ecrire");
  const [accounts, grades, superiors] = writable
    ? await Promise.all([
        getDb().query.users.findMany({
          columns: { id: true, displayName: true, username: true },
          orderBy: (table, operators) => [operators.asc(table.displayName)],
        }),
        getDb().select().from(citizenGrades).orderBy(asc(citizenGrades.sortOrder), asc(citizenGrades.name)),
        getDb()
          .select({ id: citizens.id, name: citizens.name })
          .from(citizens)
          .orderBy(asc(citizens.name)),
      ])
    : [[], [], []];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/recensement?statut=${citizen.status}`} className="text-sm text-gold">
          Retour à {CITIZEN_STATUS[citizen.status] ?? citizen.status}
        </Link>
        {writable ? (
          <Link href={`/recensement/${citizen.id}#corriger`} className="rounded-full border border-gold/50 px-4 py-2 text-sm text-gold">
            Corriger la fiche
          </Link>
        ) : null}
      </div>

      <article className="fiche">
        <div className="flex items-start justify-between gap-4">
          <img src="/gaelia/bouclier.png" alt="" className="h-16 w-16" />
          <p className="text-right text-[11px] uppercase tracking-[0.16em] text-[#8d6b32]">
            <span className="block font-display text-base tracking-[0.2em] text-[#3c2b20]">État</span>
            {CITIZEN_STATUS[citizen.status] ?? citizen.status}
          </p>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <Portrait storageKey={citizen.portraitKey} name={citizen.name} size="h-20 w-20" />
          <div>
            <h1 className="font-display text-5xl leading-none text-[#241910]">{citizen.name}</h1>
            <p className="mt-2 font-serif text-xl italic text-[#3c2b20]">
              {citizen.grade?.name ?? "Sans grade"}
              {citizen.epithet ? ` · ${citizen.epithet}` : ""}
            </p>
            {citizen.superior ? (
              <p className="mt-2 text-sm text-[#6b5644]">
                Sous{" "}
                <Link href={`/recensement/${citizen.superior.id}`} className="text-[#8d6b32] underline decoration-[#8d6b32]/40">
                  {citizen.superior.name}
                </Link>
              </p>
            ) : citizen.grade?.name.toLowerCase() === "gaelor" ? (
              <p className="mt-2 text-sm text-[#6b5644]">Sans supérieur — sommet de la nation</p>
            ) : null}
            {citizen.joinedOn ? <p className="mt-2 text-sm text-[#6b5644]">Depuis {formatDay(citizen.joinedOn)}</p> : null}
          </div>
        </div>
        {citizen.notes ? <p className="mt-5 whitespace-pre-wrap font-serif text-lg leading-8">{citizen.notes}</p> : null}
        <img src="/gaelia/sceau.png" alt="" className="fiche-seal" />
      </article>

      {writable ? (
        <div id="corriger" className="form-sheet mt-8">
          <h2 className="font-display text-3xl">Corriger la fiche</h2>
          <p className="mt-2 text-sm text-ink-soft">Grade, supérieur, état, notes et portrait du recensement.</p>
          <div className="mt-4">
            <CitizenForm citizen={citizen} accounts={accounts} grades={grades} superiors={superiors} />
          </div>
          <div className="mt-6 border-t border-[#eadcc0] pt-4">
            <ActionForm action={deleteCitizen}>
              <input type="hidden" name="id" value={citizen.id} />
              <Button type="submit" variant="danger">
                Retirer du recensement
              </Button>
            </ActionForm>
          </div>
        </div>
      ) : null}
    </div>
  );
}
