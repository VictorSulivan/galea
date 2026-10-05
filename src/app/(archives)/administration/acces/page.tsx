import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Badge, Button, PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { can } from "@/lib/permissions";
import { approveDiscordAccess, denyDiscordAccess } from "@/server/access";

export const metadata = { title: "Accès" };

export default async function AccessPage() {
  const user = await getCurrentUser();
  if (!user || !can(user, "acces.gerer")) redirect("/administration");
  const rows = await getDb().query.users.findMany({
    with: { grants: true },
    orderBy: (table, operators) => [operators.asc(table.displayName)],
  });
  const pending = rows.filter((account) => account.accessStatus === "pending");
  const others = rows.filter((account) => account.accessStatus !== "pending");

  return (
    <div>
      <PageHeader
        kicker="Sceaux"
        title="Accès"
        lede="Quand quelqu’un frappe avec Discord, sa demande apparaît ici. Sans whitelist, l’espace privé reste fermé."
        action={
          <Link href="/administration/acces/nouveau" className="rounded-full bg-gold px-4 py-2 text-sm text-moss-deep">
            Compte mot de passe
          </Link>
        }
      />

      {pending.length ? (
        <section className="mb-10">
          <h2 className="font-display text-3xl">Demandes Discord</h2>
          <p className="mt-1 text-sm text-sap">{pending.length} en attente de whitelist.</p>
          <div className="mt-4 grid gap-3">
            {pending.map((account) => (
              <Panel key={account.id} className="!p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {account.discordAvatar ? (
                      <img src={account.discordAvatar} alt="" className="h-12 w-12 rounded-full border border-gold/30" />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-moss text-parchment">D</div>
                    )}
                    <div>
                      <h3 className="font-display text-2xl">{account.displayName}</h3>
                      <p className="text-sm text-ink-soft">
                        @{account.discordUsername ?? account.username}
                        {account.discordId ? ` · ${account.discordId}` : ""}
                      </p>
                      <Badge tone="gold">En attente</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ActionForm action={approveDiscordAccess}>
                      <input type="hidden" name="id" value={account.id} />
                      <Button type="submit">Whitelist + degrés</Button>
                    </ActionForm>
                    <ActionForm action={denyDiscordAccess}>
                      <input type="hidden" name="id" value={account.id} />
                      <Button type="submit" variant="danger">
                        Refuser
                      </Button>
                    </ActionForm>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </section>
      ) : (
        <p className="mb-8 rounded-2xl border border-white/10 px-4 py-3 text-sm text-sap">Aucune demande Discord en attente.</p>
      )}

      <h2 className="font-display text-3xl">Comptes</h2>
      <div className="mt-4 grid gap-3">
        {others.map((account) => (
          <Link key={account.id} href={`/administration/acces/${account.id}`}>
            <Panel className="flex flex-wrap items-center justify-between gap-3 !p-4">
              <div className="flex items-center gap-3">
                {account.discordAvatar ? (
                  <img src={account.discordAvatar} alt="" className="h-10 w-10 rounded-full border border-gold/30" />
                ) : null}
                <div>
                  <h2 className="font-display text-2xl">{account.displayName}</h2>
                  <p className="text-sm text-ink-soft">
                    {account.discordUsername ? `@${account.discordUsername}` : account.username}
                    {account.title ? ` · ${account.title}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {account.isSuperAdmin ? <Badge>Gardien technique</Badge> : null}
                {account.discordId ? <Badge tone="leaf">Discord</Badge> : <Badge>Mot de passe</Badge>}
                {account.accessStatus === "denied" ? <Badge tone="clay">Refusé</Badge> : null}
                {!account.active ? <Badge tone="clay">Suspendu</Badge> : null}
                <span className="text-sm text-ink-soft">
                  {account.isSuperAdmin ? "accès total" : `${account.grants.length} droits`}
                </span>
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
