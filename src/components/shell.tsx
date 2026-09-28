import { asc } from "drizzle-orm";
import type { SessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { shelves } from "@/lib/db/schema";
import { PLACE_LORE } from "@/lib/guardian-script";
import { can, canEnterAdmin, canReadShelf, canVoice } from "@/lib/permissions";
import { ArchivesScene } from "./archives-scene";

const OPEN: Record<string, (user: SessionUser) => boolean> = {
  "/annuaire": (user) => can(user, "zone.annuaire"),
  "/bibliotheque": (user) => can(user, "zone.bibliotheque"),
  "/recensement": (user) => can(user, "zone.recensement"),
  "/organigramme": (user) => can(user, "zone.organigramme"),
  "/voix": (user) => canVoice(user),
  "/parvis": () => true,
  "/administration": (user) => canEnterAdmin(user),
  "/compte": () => true,
};

export async function Shell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const shelfRows = await getDb().select().from(shelves).orderBy(asc(shelves.sortOrder));
  const places = PLACE_LORE.filter((place) => OPEN[place.href]?.(user));
  const shelfStops = shelfRows
    .filter((shelf) => canReadShelf(user, shelf.slug))
    .map((shelf) => ({ slug: shelf.slug, name: shelf.name, about: shelf.description }));

  return (
    <ArchivesScene name={user.displayName} title={user.title} places={places} shelves={shelfStops}>
      {children}
    </ArchivesScene>
  );
}
