export const POWER_LEVELS = [
  { level: 0, label: "Fermé", brief: "Rien" },
  { level: 1, label: "I · Novice", brief: "Entrer / lire le simple" },
  { level: 2, label: "II · Initié", brief: "Lire plus loin" },
  { level: 3, label: "III · Gardien", brief: "Écrire / tenir" },
  { level: 4, label: "IV · Conseil", brief: "Diriger la Voix" },
  { level: 5, label: "V · Gaelor", brief: "Plein pouvoir" },
] as const;

export type ZoneEffect = { min: number; text: string };

export const ZONES = [
  {
    key: "zone.hall",
    label: "Le Hall",
    summary: "Table d’accueil de l’espace privé.",
    effects: [{ min: 1, text: "Entrer au Hall et voir le résumé (lettres, décrets, livres récents)." }],
  },
  {
    key: "zone.annuaire",
    label: "Annuaire",
    summary: "Personnes du serveur. Les catégories se définissent dans l’annuaire.",
    effects: [
      { min: 1, text: "Consulter les fiches et les catégories." },
      { min: 3, text: "Créer ou corriger une fiche, et gérer la liste des catégories." },
    ],
  },
  {
    key: "zone.bibliotheque",
    label: "Bibliothèque",
    summary: "Rayons et livres. Les rayons se créent dans la salle du sceau.",
    effects: [
      { min: 1, text: "Entrer dans la bibliothèque (il faut aussi un degré sur chaque rayon)." },
      { min: 3, text: "Écrire ou corriger des livres dans les rayons déjà ouverts à cette personne." },
      { min: 5, text: "Créer, renommer ou retirer des rayons (salle du sceau → Rayons)." },
    ],
  },
  {
    key: "zone.recensement",
    label: "Recensement",
    summary: "Membres de Gaélia. Grades et hiérarchie se définissent ici.",
    effects: [
      { min: 1, text: "Consulter les membres et leurs fiches." },
      { min: 3, text: "Inscrire un membre, choisir grade et supérieur, gérer la liste des grades." },
    ],
  },
  {
    key: "zone.organigramme",
    label: "Organigramme",
    summary: "Offices de la nation (places administrables).",
    effects: [
      { min: 1, text: "Voir l’arbre des offices et qui les tient." },
      { min: 3, text: "Créer, déplacer ou retirer un office, et y asseoir un membre." },
    ],
  },
  {
    key: "zone.voix",
    label: "La Voix",
    summary: "Décrets, lettres officielles et cahier interne.",
    effects: [
      {
        min: 4,
        text: "Rédiger et publier décrets et lettres (Parvis), et tenir le cahier des réunions (privé).",
      },
    ],
  },
  {
    key: "zone.administration",
    label: "Salle du sceau",
    summary: "Comptes et degrés d’accès.",
    effects: [
      { min: 4, text: "Ouvrir un compte et régler les portes de chaque personne." },
      { min: 5, text: "Même pouvoir, avec le plein degré Gaelor sur le reste si le modèle Gaelor est appliqué." },
    ],
  },
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
  {
    id: "citoyen",
    label: "Citoyen",
    about: "Entre, lit l’annuaire, le recensement, l’organigramme et les rayons ouverts.",
  },
  {
    id: "archiviste",
    label: "Archiviste",
    about: "Comme le citoyen, et écrit dans les rayons ouverts ; lit un peu les rayons restreints.",
  },
  {
    id: "chercheur",
    label: "Chercheur",
    about: "Citoyen qui écrit surtout dans le rayon Recherche.",
  },
  {
    id: "scribe",
    label: "Scribe",
    about: "Citoyen qui tient aussi l’annuaire (fiches et catégories).",
  },
  {
    id: "conseil",
    label: "Conseil",
    about: "Tient nation et Voix : écriture large, décrets, lettres, cahier, et peut régler les accès.",
  },
  {
    id: "gaelor",
    label: "Gaelor",
    about: "Tout ouvert au degré 5 — modèle de départ pour le chef de nation.",
  },
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

export function zoneEffectsAt(effects: readonly ZoneEffect[], level: number) {
  return effects.filter((effect) => level >= effect.min).map((effect) => effect.text);
}

export function shelfEffectsAt(level: number, sensitivity: Sensitivity) {
  if (level <= 0) return ["Rayon fermé : aucun livre de cette section."];
  const lines = [
    `Lire les écrits de degré ${level} et en dessous dans ce rayon.`,
  ];
  if (sensitivity === "secret") {
    lines.push("Rayon secret : seuls ceux à qui tu ouvres ce degré y entrent.");
  } else if (sensitivity === "restreint") {
    lines.push("Rayon restreint : réservé au cercle que tu choisis.");
  }
  lines.push("Pour y écrire, il faut aussi le degré III sur la Bibliothèque.");
  return lines;
}

export function describeGrant(key: string, level: number, shelves: ShelfRef[]) {
  const zone = ZONES.find((item) => item.key === key);
  if (zone) {
    const unlocked = zoneEffectsAt(zone.effects, level);
    if (level <= 0) return "Fermé.";
    if (unlocked.length === 0) return `Degré ${level} : pas encore d’effet utile (seuil plus haut).`;
    return unlocked.join(" ");
  }
  const match = /^rayon\.([a-z0-9-]+)$/.exec(key);
  if (!match) return key;
  const shelf = shelves.find((item) => item.slug === match[1]);
  return shelfEffectsAt(level, shelf?.sensitivity ?? "ouvert").join(" ");
}

export function sensitivityLabel(value: Sensitivity) {
  if (value === "secret") return "Secret";
  if (value === "restreint") return "Restreint";
  return "Ouvert";
}
