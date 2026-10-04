import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Mark } from "./ui";

export async function PublicFrame({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between gap-4 border-b border-gold/20 px-5 py-5 md:px-10">
        <Link href="/parvis" className="flex items-center gap-3 text-gold">
          <Mark />
          <span>
            <span className="block font-display text-2xl leading-none text-parchment">Gaélia</span>
            <span className="text-[11px] uppercase tracking-[0.2em]">Espace public</span>
          </span>
        </Link>
        <Link href={user ? "/hall" : "/connexion"} className="rounded-full border border-gold/40 px-4 py-2 text-sm text-gold">
          {user ? "Espace privé" : "Entrer dans l’espace privé"}
        </Link>
      </header>
      <main className="px-5 py-8 md:px-10">{children}</main>
    </div>
  );
}
