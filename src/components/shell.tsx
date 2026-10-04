import type { SessionUser } from "@/lib/auth";
import { can, canEnterAdmin, canVoice, NAV } from "@/lib/permissions";
import { Dashboard } from "./dashboard";

export async function Shell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const links = [
    ...NAV.filter((item) => (item.key === "zone.voix" ? canVoice(user) : can(user, item.key))).map((item) => ({
      href: item.href,
      label: item.label,
    })),
    { href: "/parvis", label: "Espace public" },
    ...(canEnterAdmin(user) ? [{ href: "/administration", label: "Sceau" }] : []),
    { href: "/compte", label: "Compte" },
  ];

  return (
    <Dashboard name={user.displayName} title={user.title} username={user.username} links={links}>
      {children}
    </Dashboard>
  );
}
