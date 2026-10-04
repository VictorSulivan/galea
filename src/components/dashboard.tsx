"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/server/session";
import { Mark } from "./ui";

export function Dashboard({
  name,
  title,
  username,
  links,
  children,
}: {
  name: string;
  title: string | null;
  username: string;
  links: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen md:grid md:grid-cols-[17rem_1fr]">
      <aside className="border-b border-gold/25 bg-[#10241c]/90 px-4 py-5 md:sticky md:top-0 md:flex md:h-screen md:flex-col md:overflow-y-auto md:border-r md:border-b-0">
        <div className="flex items-center gap-3 text-gold">
          <Mark />
          <div>
            <p className="font-display text-2xl leading-none text-parchment">Gaélia</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em]">Espace privé</p>
          </div>
        </div>
        <nav className="mt-6 flex gap-1 overflow-x-auto md:mt-8 md:min-h-0 md:flex-1 md:flex-col md:gap-1 md:overflow-y-auto">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/hall" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-xl px-3 py-2 text-sm ${active ? "bg-gold/15 text-gold" : "text-sap hover:bg-white/5"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 shrink-0 border-t border-gold/20 pt-4 md:mt-4">
          <p className="font-display text-lg leading-tight text-parchment">{name}</p>
          <p className="text-xs text-sap">{title || username}</p>
          <form action={logout} className="mt-3">
            <button type="submit" className="text-sm text-gold hover:text-parchment">
              Quitter la table
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
