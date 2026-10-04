export type GuideReply = {
  text: string;
  href?: string;
  beat?: string;
  logout?: boolean;
  close?: boolean;
};

export type GuideBeat = {
  id: string;
  text: string;
  replies?: GuideReply[];
};

export type GuidePlace = {
  href: string;
  page: 1 | 2;
  name: string;
  about: string;
};

export type GuideShelf = {
  slug: string;
  name: string;
  about: string;
};

export const PLACE_LORE: GuidePlace[] = [
  {
    href: "/annuaire",
    page: 1,
    name: "L’annuaire",
    about: "L’annuaire. Les noms de ceux qui vivent sur cette terre, leurs titres, à quelle porte frapper. Avant les secrets, il y a les gens.",
  },
  {
    href: "/bibliotheque",
    page: 1,
    name: "La bibliothèque",
    about: "La bibliothèque. Une allée sous les arbres. Tu marches de rayon en rayon : nations, bêtes, plantes, magie, poisons, secrets. Ton degré décide de ce que la racine te laisse lire.",
  },
  {
    href: "/recensement",
    page: 1,
    name: "Le recensement",
    about: "Le recensement. Les âmes comptées de la nation. Pas des rumeurs : des présences, inscrites pour que la terre sache qui elle porte.",
  },
  {
    href: "/organigramme",
    page: 1,
    name: "L’organigramme",
    about: "L’organigramme. La racine et les branches. Qui commande, qui conseille, qui sert. Sans ça, une nation n’est qu’un bois sans sentier.",
  },
  {
    href: "/voix",
    page: 2,
    name: "La Voix",
    about: "La Voix. Décrets, lettres officielles, et le cahier interne des réunions. Seuls le Gaelor et le conseil rédigent. Les textes publics vont au Parvis ; le cahier reste privé.",
  },
  {
    href: "/parvis",
    page: 2,
    name: "Le Parvis",
    about: "Le Parvis. Dehors, à la lisière. Ce que la nation a choisi de montrer au monde. On peut y lire sans être des nôtres.",
  },
  {
    href: "/administration",
    page: 2,
    name: "La salle du sceau",
    about: "La salle du sceau. Les degrés d’accès. Qui ouvre quel secret, jusqu’où. On n’y entre pas pour flâner.",
  },
  {
    href: "/compte",
    page: 2,
    name: "Ton sceau",
    about: "Ton sceau. Ton nom, ton titre, la trace que tu laisses en passant sous les arbres. Le mien reste le mien.",
  },
];

function après(back: string): GuideReply[] {
  return [
    { text: "Encore une question.", beat: back },
    { text: "Guide-moi plutôt.", beat: "guide" },
    { text: "Ça suffit. Je reste.", close: true },
  ];
}

function lieuId(href: string) {
  return `lieu-${href.replace(/^\//, "")}`;
}

export function guardianScript({
  name,
  title,
  places,
  shelves,
  news,
}: {
  name: string;
  title: string | null;
  places: GuidePlace[];
  shelves: GuideShelf[];
  news?: string[];
}): GuideBeat[] {
  const rank = title ? `, ${title}` : "";
  const page1 = places.filter((place) => place.page === 1);
  const page2 = places.filter((place) => place.page === 2);
  const shelfPages: GuideShelf[][] = [];
  for (let index = 0; index < shelves.length; index += 6) shelfPages.push(shelves.slice(index, index + 6));

  const fork: GuideReply[] = [
    { text: "Bavardons. J’ai le temps.", beat: "bavarder" },
    { text: "Guide-moi. Où va-t-on ?", beat: "guide" },
    ...(news?.length ? [{ text: "Quoi de neuf sous les racines ?", beat: "nouvelles" }] : []),
    { text: "Je quitte les archives.", logout: true },
    { text: "Pas maintenant. Reste dans l’ombre.", close: true },
  ];

  const guideReplies: GuideReply[] = [
    ...page1.map((place) => ({ text: place.name, beat: lieuId(place.href) })),
    ...(page2.length ? [{ text: "D’autres lieux.", beat: "guide-2" }] : []),
    ...(shelfPages.length ? [{ text: "Les rayons, un par un.", beat: "rayons-0" }] : []),
    { text: "Plutôt bavarder.", beat: "bavarder" },
    { text: "Je reste ici.", close: true },
  ];

  const beats: GuideBeat[] = [
    {
      id: "salut",
      text: `Le capuchon ne se lève pas. ${name}${rank}. Les racines t’ont reconnu. Moi, je ne montre pas mon visage pour si peu.`,
      replies: fork,
    },
    {
      id: "seuil",
      text: `${name}. Encore toi. Le visage reste dans l’ombre. Tu veux parler, ou que je te mène quelque part ?`,
      replies: fork,
    },
    {
      id: "bavarder",
      text: "Parle, alors. La mousse a plus de patience que moi, mais elle répond moins.",
      replies: [
        { text: "Pourquoi caches-tu ton visage ?", beat: "visage" },
        { text: "Cette forêt te parle ?", beat: "foret" },
        { text: "Tu gardes quoi, au juste ?", beat: "charge" },
        { text: "Raconte quelque chose d’ancien.", beat: "histoire" },
        { text: "La magie, ici, elle est vraie ?", beat: "magie" },
        { text: "Tu pourrais être moins désagréable.", beat: "aimable" },
        { text: "Assez. Montre-moi le chemin.", beat: "guide" },
        { text: "Je me tais.", close: true },
      ],
    },
    {
      id: "visage",
      text: "Le visage se montre à ceux qui ont gagné l’ombre, pas à ceux qui demandent leur chemin. Le capuchon suffit. La lanterne aussi. Le reste appartient à la terre.",
      replies: après("bavarder"),
    },
    {
      id: "foret",
      text: "Elle ne parle pas. Elle se souvient. Mousse, sève, os sous l’humus. Si tu écoutes trop longtemps, tu oublies pourquoi tu es entré.",
      replies: après("bavarder"),
    },
    {
      id: "charge",
      text: "Je garde ce que Gaélia ne veut pas voir traîner au grand jour. Les degrés. Les noms. Ce qui dort sous la racine. La nation est terre et nature. Moi, je suis la porte.",
      replies: après("bavarder"),
    },
    {
      id: "histoire",
      text: "Avant les routes, il y a eu le pacte. La terre nourrit, la nation rend. Un Gaelor a signé avec les racines. Depuis, on écrit, pour ne pas mentir à ce qui pousse.",
      replies: après("bavarder"),
    },
    {
      id: "magie",
      text: "Pas des étincelles de foire. Une sève qui ignore la saison. Des bêtes qui connaissent ton nom avant toi. Ça dort dans les rayons de flore et de faune magiques, si ton degré te les ouvre.",
      replies: après("bavarder"),
    },
    {
      id: "aimable",
      text: "L’amabilité est une herbe de surface. Ici on est sous l’écorce. Je te réponds. C’est déjà beaucoup.",
      replies: après("bavarder"),
    },
    {
      id: "guide",
      text: page1.length || page2.length || shelfPages.length
        ? "Très bien. Choisis un lieu. Je te dis à quoi il sert. Ensuite seulement, je t’y mène."
        : "Aucun sentier ne s’ouvre à ton degré. Surprenant, venant de toi. On reste là.",
      replies: guideReplies,
    },
  ];

  if (news?.length) {
    beats.push({
      id: "nouvelles",
      text: `Puisque tu vas me le demander quand même : ${news.join(", ")}. Voilà. Range ta curiosité.`,
      replies: après("seuil"),
    });
  }

  if (page2.length) {
    beats.push({
      id: "guide-2",
      text: "Le reste. Le dehors, la parole officielle, et les sceaux. Toujours pas de visite joyeuse.",
      replies: [
        ...page2.map((place) => ({ text: place.name, beat: lieuId(place.href) })),
        { text: "Les premières salles.", beat: "guide" },
        { text: "Plutôt bavarder.", beat: "bavarder" },
        { text: "Je reste ici.", close: true },
      ],
    });
  }

  for (const place of places) {
    const back = place.page === 2 && page2.length ? "guide-2" : "guide";
    beats.push({
      id: lieuId(place.href),
      text: place.about,
      replies: [
        { text: `Mène-moi. ${place.name}.`, href: place.href },
        { text: "Une autre salle.", beat: back },
        { text: "Plutôt bavarder.", beat: "bavarder" },
      ],
    });
  }

  shelfPages.forEach((page, pageIndex) => {
    beats.push({
      id: `rayons-${pageIndex}`,
      text: pageIndex === 0
        ? "Les rayons ouverts à ton degré. Nomme-en un. Je te dis ce qu’il contient, puis tu décides d’y entrer."
        : "La suite de l’allée. Même règle : je t’explique, ensuite tu marches.",
      replies: [
        ...page.map((shelf) => ({ text: shelf.name, beat: `rayon-${shelf.slug}` })),
        ...(pageIndex < shelfPages.length - 1 ? [{ text: "La suite des rayons.", beat: `rayons-${pageIndex + 1}` }] : []),
        ...(pageIndex > 0 ? [{ text: "Les premiers rayons.", beat: "rayons-0" }] : []),
        { text: "Retour aux salles.", beat: "guide" },
      ],
    });
  });

  for (const shelf of shelves) {
    const pageIndex = shelfPages.findIndex((page) => page.some((item) => item.slug === shelf.slug));
    beats.push({
      id: `rayon-${shelf.slug}`,
      text: shelf.about,
      replies: [
        { text: `J’y entre. ${shelf.name}.`, href: `/bibliotheque/${shelf.slug}` },
        { text: "Un autre rayon.", beat: `rayons-${Math.max(0, pageIndex)}` },
        { text: "Retour aux salles.", beat: "guide" },
      ],
    });
  }

  return beats;
}
