import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { canVoice } from "@/lib/permissions";

export const metadata = { title: "La Voix" };

const ROOMS = [
  { href: "/decrets", title: "Décrets", text: "Textes de loi. Ils reçoivent un numéro GAE au moment où ils sont promulgués sur le Parvis." },
  { href: "/parchemins", title: "Parchemins", text: "Annonces clouées pour que toute la nation, et ceux du dehors, les lisent." },
  { href: "/lettres", title: "Lettres officielles", text: "La parole des dirigeants. Pas un courrier d'un membre à un autre." },
];

export default async function VoicePage() {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) redirect("/parvis");

  return (
    <div>
      <PageHeader
        kicker="Hautes têtes"
        title="La Voix"
        lede="Le Gaelor et le Conseil rédigent ici. Quand le texte est fini, il est publié sur le Parvis, lisible sans sceau."
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
