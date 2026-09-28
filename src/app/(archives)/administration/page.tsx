import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { can, canEnterAdmin } from "@/lib/permissions";

export const metadata = { title: "Salle du sceau" };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || !canEnterAdmin(user)) redirect("/hall");
  const cards = [
    can(user, "acces.gerer")
      ? { href: "/administration/acces", title: "Accès", text: "Comptes et degrés de pouvoir, section par section, rayon par rayon." }
      : null,
    can(user, "rayons.gerer")
      ? { href: "/administration/rayons", title: "Rayons", text: "Ouvrir une nouvelle section de bibliothèque. Personne n'y entre tant qu'un degré ne lui est pas donné." }
      : null,
  ].filter((card) => card !== null);

  return (
    <div>
      <PageHeader kicker="Administration" title="Salle du sceau" lede="Ici se décident les degrés. Un initié de niveau 2 lit les secrets 1 et 2. Le niveau 5 reste au Gaelor." />
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Panel className="h-full">
              <h2 className="font-display text-3xl">{card.title}</h2>
              <p className="mt-2 text-ink-soft">{card.text}</p>
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  );
}
