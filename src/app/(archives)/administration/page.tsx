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
      ? {
          href: "/administration/acces",
          title: "Accès",
          text: "Ouvrir un compte, poser un modèle, puis régler chaque porte avec une phrase claire : qui lit, qui écrit, qui tient.",
        }
      : null,
    can(user, "rayons.gerer")
      ? {
          href: "/administration/rayons",
          title: "Rayons",
          text: "Créer une section de bibliothèque. Personne n’y entre tant qu’un degré n’est pas donné sur la fiche d’accès.",
        }
      : null,
  ].filter((card) => card !== null);

  return (
    <div>
      <PageHeader
        kicker="Administration"
        title="Salle du sceau"
        lede="Les listes (grades, catégories, offices, rayons) se tiennent dans chaque salle. Ici, tu décides seulement qui peut les ouvrir."
      />
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
