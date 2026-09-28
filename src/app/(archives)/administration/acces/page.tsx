import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { can } from "@/lib/permissions";

export const metadata = { title: "Accès" };

export default async function AccessPage() {
  const user = await getCurrentUser();
  if (!user || !can(user, "acces.gerer")) redirect("/administration");
  const rows = await getDb().query.users.findMany({
    with: { grants: true },
    orderBy: (table, operators) => [operators.asc(table.displayName)],
  });

  return (
    <div>
      <PageHeader
        kicker="Sceaux"
        title="Accès"
        lede="Chaque personne a sa propre checklist. Un modèle ne fait que pré-cocher : tu peux ensuite retirer une seule porte."
        action={
          <Link href="/administration/acces/nouveau" className="rounded-full bg-gold px-4 py-2 text-sm text-moss-deep">
            Ouvrir un compte
          </Link>
        }
      />
      <div className="grid gap-3">
        {rows.map((account) => (
          <Link key={account.id} href={`/administration/acces/${account.id}`}>
            <Panel className="flex flex-wrap items-center justify-between gap-3 !p-4">
              <div>
                <h2 className="font-display text-2xl">{account.displayName}</h2>
                <p className="text-sm text-ink-soft">
                  {account.email}
                  {account.title ? ` · ${account.title}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {account.isSuperAdmin ? <Badge>Gardien technique</Badge> : null}
                {!account.active ? <Badge tone="clay">Suspendu</Badge> : null}
                <span className="text-sm text-ink-soft">{account.isSuperAdmin ? "accès total" : `${account.grants.length} droits`}</span>
              </div>
            </Panel>
          </Link>
        ))}
      </div>
      <p className="mt-4 text-sm text-sap">
        <Link href="/administration">Retour à la salle du sceau</Link>
      </p>
    </div>
  );
}
