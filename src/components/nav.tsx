"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <div className="flex gap-2 overflow-x-auto md:grid md:gap-1">
      {items.map((item, index) => {
        const active = pathname === item.href || (item.href !== "/hall" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-full px-3 py-2 text-sm transition md:rounded-xl ${
              active ? "bg-gold text-moss-deep" : "text-parchment/80 hover:bg-white/5 hover:text-parchment"
            }`}
          >
            <span className="mr-2 font-mono text-[10px] tracking-widest text-gold/80 md:text-inherit">{String(index + 1).padStart(2, "0")}</span>
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
