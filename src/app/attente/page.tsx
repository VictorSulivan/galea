import Link from "next/link";
import { redirect } from "next/navigation";
import { Mark } from "@/components/ui";
import { getCurrentUser, isWhitelisted } from "@/lib/auth";
import { logout } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "En attente du sceau" };

export default async function WaitingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (isWhitelisted(user)) redirect("/hall");

  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <div className="form-sheet w-full max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center text-gold">
          <Mark className="h-10 w-10" />
        </div>
        <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-gold-deep">Discord reçu</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Le sceau n’est pas encore ouvert.</h1>
        <p className="mt-4 font-serif text-lg leading-8 text-ink-soft">
          {user.displayName}
          {user.discordUsername ? ` (@${user.discordUsername})` : ""} a frappé à la table. Un Gardien ou le Gaelor doit
          t’inscrire dans la liste blanche avant d’entrer dans l’espace privé.
        </p>
        <p className="mt-4 text-sm text-ink-soft">Tu peux relire les décrets sur le Parvis en attendant.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/parvis" className="rounded-full bg-gold px-4 py-2 text-sm text-moss-deep">
            Lire le Parvis
          </Link>
          <form action={logout}>
            <button type="submit" className="rounded-full border border-[#d9c7a3] px-4 py-2 text-sm text-ink">
              Quitter
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
