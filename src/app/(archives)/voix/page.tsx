import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { canVoice } from "@/lib/permissions";

export const metadata = { title: "La Voix" };

const ROOMS = [
  {
    href: "/decrets",
    title: "Décrets",
    text: "Textes de loi du Gaelor et du Conseil. On écrit le rôle qui a fait et publié le décret, puis on le promulgue sur le Parvis.",
  },
  {
    href: "/lettres",
    title: "Lettres officielles",
    text: "La parole des dirigeants, publiée sur le Parvis. Pas un courrier d’un membre à un autre.",
  },
  {
    href: "/cahier",
    title: "Cahier interne",
    text: "Rapports de réunion et événements de la nation, notés pour le Conseil — jamais affichés sur le Parvis.",
  },
];

export default async function VoicePage() {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) redirect("/parvis");

  return (
    <div>
      <PageHeader
        kicker="Hautes têtes"
        title="La Voix"
        lede="Le Gaelor et le Conseil rédigent ici. Les décrets et lettres vont au Parvis. Le cahier reste entre nous."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {ROOMS.map((room) => (
          <Link key={room.href} href={room.href}>
            <Panel className="h-full">
              <h2 className="font-display text-3xl">{room.title}</h2>
              <p className="mt-2 text-ink-soft">{room.text}</p>
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  );
}
