import Link from "next/link";
import { Mark } from "./ui";

export function PublicFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between gap-4 px-5 py-5 md:px-10">
        <Link href="/parvis" className="flex items-center gap-3 text-gold">
          <Mark />
          <span>
            <span className="block font-display text-2xl leading-none text-parchment">Le Parvis</span>
            <span className="text-[11px] uppercase tracking-[0.2em]">Voix de Gaélia</span>
          </span>
        </Link>
        <Link href="/connexion" className="text-sm text-gold">
          Entrer dans les archives
        </Link>
      </header>
      <main className="px-5 pb-16 md:px-10">{children}</main>
    </div>
  );
}
