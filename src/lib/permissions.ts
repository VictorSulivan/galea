export const POWER_LEVELS = [
  { level: 0, label: "Fermé" },
  { level: 1, label: "I · Novice" },
  { level: 2, label: "II · Initié" },
  { level: 3, label: "III · Gardien" },
  { level: 4, label: "IV · Conseil" },
  { level: 5, label: "V · Gaelor" },
] as const;

export const ZONES = [
  { key: "zone.hall", label: "Le Hall", hint: "1 pour entrer. Les degrés plus hauts ne changent pas cette salle." },
  { key: "zone.annuaire", label: "Annuaire", hint: "1 consulter, 3 rédiger les fiches." },
  { key: "zone.bibliotheque", label: "Bibliothèque", hint: "1 entrer, 3 écrire dans les rayons ouverts, 5 ordonner les rayons." },
  { key: "zone.recensement", label: "Recensement", hint: "1 consulter, 3 tenir les membres." },
  { key: "zone.organigramme", label: "Organigramme", hint: "1 voir l'arbre, 3 le dresser." },
  { key: "zone.voix", label: "La Voix", hint: "4 Conseil et 5 Gaelor rédigent décrets, parchemins et lettres, puis les publient sur le Parvis." },
  { key: "zone.administration", label: "Salle du sceau", hint: "4 gère les degrés d'accès. 5 est le plein pouvoir." },
] as const;

export const NAV = [
  { href: "/hall", key: "zone.hall", label: "Le Hall" },
  { href: "/annuaire", key: "zone.annuaire", label: "Annuaire" },
  { href: "/bibliotheque", key: "zone.bibliotheque", label: "Bibliothèque" },
  { href: "/recensement", key: "zone.recensement", label: "Recensement" },
  { href: "/organigramme", key: "zone.organigramme", label: "Organigramme" },
  { href: "/voix", key: "zone.voix", label: "La Voix" },
] as const;

export const PRESETS = [
  { id: "citoyen", label: "Citoyen" },
  { id: "archiviste", label: "Archiviste" },
  { id: "chercheur", label: "Chercheur" },
  { id: "scribe", label: "Scribe" },
  { id: "conseil", label: "Conseil" },
  { id: "gaelor", label: "Gaelor" },
] as const;

export type PresetId = (typeof PRESETS)[number]["id"];
export type Sensitivity = "ouvert" | "restreint" | "secret";

export type ShelfRef = {
  slug: string;
  name: string;
  sensitivity: Sensitivity;
};

export type GrantLevel = {
  key: string;
  level: number;
};

export type AccessUser = {
  isSuperAdmin: boolean;
  grants: GrantLevel[];
};

export const DEFAULT_SHELVES: Array<ShelfRef & { description: string; sortOrder: number }> = [
  {
    slug: "nations",
    name: "Les autres nations",
    description: "Ce que Gaélia sait des peuples voisins, de leurs rites et de leurs frontières.",
    sensitivity: "ouvert",
    sortOrder: 10,
  },
  {
    slug: "entreprises",
    name: "Entreprises",
    description: "Maisons, ateliers et comptoirs qui font tourner le serveur.",
    sensitivity: "ouvert",
    sortOrder: 20,
  },
  {
    slug: "evenements",
    name: "Événements",
    description: "Chronique de ce qui a été vécu, pour que rien ne se perde.",
    sensitivity: "ouvert",
    sortOrder: 30,
  },
  {
    slug: "flore",
    name: "Flore",
    description: "Plantes, arbres, récoltes et usages ordinaires.",
    sensitivity: "ouvert",
    sortOrder: 40,
  },
  {
    slug: "faune",
    name: "Faune",
    description: "Bêtes des bois, des champs et des routes.",
    sensitivity: "ouvert",
    sortOrder: 50,
  },
  {
    slug: "flore-magique",
    name: "Flore magique",
    description: "Pousses qui ne répondent pas aux saisons ordinaires.",
    sensitivity: "ouvert",
    sortOrder: 60,
  },
  {
    slug: "faune-magique",
    name: "Faune magique",
    description: "Créatures liées à la terre et à ce qui dort dessous.",
    sensitivity: "ouvert",
    sortOrder: 70,
  },
  {
    slug: "artisanat",
    name: "Artisanat",
    description: "Crafts, recettes et gestes transmis dans la nation.",
    sensitivity: "ouvert",
    sortOrder: 80,
  },
  {
    slug: "poisons",
    name: "Poisons",
    description: "Savoirs dangereux, ouverts seulement au cercle autorisé.",
    sensitivity: "restreint",
    sortOrder: 90,
  },
  {
    slug: "recherche",
    name: "Recherche",
    description: "Travaux en cours et notes qui ne sont pas encore un savoir public.",
    sensitivity: "restreint",
    sortOrder: 100,
  },
  {
    slug: "secrets",
    name: "Secrets de Gaélia",
    description: "Ce que la nation garde sous la racine. Chaque écrit a un degré : un initié de niveau 2 ne lit pas un secret de niveau 5.",
    sensitivity: "secret",
    sortOrder: 110,
  },
  {
    slug: "savoirs",
    name: "Savoirs de la nation",
    description: "Coutumes, cartes et mémoire commune.",
    sensitivity: "ouvert",
    sortOrder: 120,
  },
];

const ZONE_KEYS = ZONES.map((zone) => zone.key);

export function shelfKey(slug: string) {
  return `rayon.${slug}`;
}

export function clampLevel(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(5, Math.max(0, Math.round(value)));
}

export function levelOf(user: AccessUser, key: string) {
  if (user.isSuperAdmin) return 5;
  return user.grants.find((grant) => grant.key === key)?.level ?? 0;
}

export function can(user: AccessUser, key: string) {
  if (user.isSuperAdmin) return true;
  if (key === "annuaire.ecrire") return levelOf(user, "zone.annuaire") >= 3;
  if (key === "bibliotheque.creer") return levelOf(user, "zone.bibliotheque") >= 3;
  if (key === "recensement.ecrire") return levelOf(user, "zone.recensement") >= 3;
  if (key === "organigramme.ecrire") return levelOf(user, "zone.organigramme") >= 3;
  if (key === "rayons.gerer") return levelOf(user, "zone.bibliotheque") >= 5;
  if (key === "acces.gerer") return levelOf(user, "zone.administration") >= 4;
  if (key === "voix.rediger") return levelOf(user, "zone.voix") >= 4;
  return levelOf(user, key) >= 1;
}

export function canVoice(user: AccessUser) {
  return can(user, "voix.rediger");
}

export function shelfLevel(user: AccessUser, slug: string) {
  return levelOf(user, shelfKey(slug));
}

export function canReadShelf(user: AccessUser, slug: string) {
  return levelOf(user, "zone.bibliotheque") >= 1 && shelfLevel(user, slug) >= 1;
}

export function canWriteShelf(user: AccessUser, slug: string) {
  return can(user, "bibliotheque.creer") && shelfLevel(user, slug) >= 1;
}

export function canReadBook(user: AccessUser, slug: string, bookLevel: number) {
  return canReadShelf(user, slug) && shelfLevel(user, slug) >= bookLevel;
}

export function canWriteBook(user: AccessUser, slug: string, bookLevel: number) {
  return canWriteShelf(user, slug) && shelfLevel(user, slug) >= bookLevel;
}

export function canEnterAdmin(user: AccessUser) {
  return can(user, "acces.gerer") || can(user, "rayons.gerer");
}

export function homePath(user: AccessUser) {
  const entry = NAV.find((item) => (item.key === "zone.voix" ? canVoice(user) : can(user, item.key)));
  if (entry) return entry.href;
  if (canEnterAdmin(user)) return "/administration";
  return "/compte";
}

export function isKnownGrant(key: string, slugs: string[]) {
  if ((ZONE_KEYS as readonly string[]).includes(key)) return true;
  const match = /^rayon\.([a-z0-9-]+)$/.exec(key);
  return Boolean(match && slugs.includes(match[1]));
}

export function knownGrantKeys(shelves: ShelfRef[]) {
  return [...ZONE_KEYS, ...shelves.map((shelf) => shelfKey(shelf.slug))];
}

function at(keys: string[], level: number): GrantLevel[] {
  return keys.filter(Boolean).map((key) => ({ key, level }));
}

function merge(groups: GrantLevel[][]): GrantLevel[] {
  const levels = new Map<string, number>();
  for (const group of groups) {
    for (const grant of group) {
      levels.set(grant.key, Math.max(levels.get(grant.key) ?? 0, grant.level));
    }
  }
  return [...levels.entries()].filter(([, level]) => level > 0).map(([key, level]) => ({ key, level }));
}

function shelvesOf(shelves: ShelfRef[], sensitivity: Sensitivity) {
  return shelves.filter((shelf) => shelf.sensitivity === sensitivity).map((shelf) => shelfKey(shelf.slug));
}

export function allGrantKeys(shelves: ShelfRef[]): GrantLevel[] {
  return at([...ZONE_KEYS, ...shelves.map((shelf) => shelfKey(shelf.slug))], 5);
}

function citizenGrants(shelves: ShelfRef[]): GrantLevel[] {
  return merge([
    at(
      ["zone.hall", "zone.annuaire", "zone.bibliotheque", "zone.recensement", "zone.organigramme"],
      1,
    ),
    at(shelvesOf(shelves, "ouvert"), 2),
  ]);
}

export function presetGrants(preset: PresetId, shelves: ShelfRef[]): GrantLevel[] {
  const citizen = citizenGrants(shelves);
  const research = shelves.find((shelf) => shelf.slug === "recherche");

  if (preset === "citoyen") return citizen;
  if (preset === "archiviste") {
    return merge([
      citizen,
      at(["zone.bibliotheque"], 3),
      at(shelvesOf(shelves, "ouvert"), 4),
      at(shelvesOf(shelves, "restreint"), 2),
    ]);
  }
  if (preset === "chercheur") {
    return merge([
      citizen,
      at(["zone.bibliotheque"], 3),
      at(research ? [shelfKey(research.slug)] : [], 4),
    ]);
  }
  if (preset === "scribe") {
    return merge([citizen, at(["zone.annuaire"], 3)]);
  }
  if (preset === "conseil") {
    return merge([
      presetGrants("archiviste", shelves),
      at(["zone.annuaire", "zone.recensement", "zone.organigramme"], 3),
      at(["zone.organigramme", "zone.voix", "zone.administration"], 4),
      at(shelvesOf(shelves, "restreint"), 3),
      at(shelvesOf(shelves, "secret"), 3),
    ]);
  }
  return allGrantKeys(shelves);
}

export function grantLabel(key: string, shelves: ShelfRef[]) {
  const zone = ZONES.find((item) => item.key === key);
  if (zone) return zone.label;
  const match = /^rayon\.([a-z0-9-]+)$/.exec(key);
  if (!match) return key;
  return shelves.find((item) => item.slug === match[1])?.name ?? match[1];
}

export function levelLabel(level: number) {
  return POWER_LEVELS.find((item) => item.level === level)?.label ?? `Niveau ${level}`;
}
