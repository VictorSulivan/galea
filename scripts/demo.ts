import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";

loadEnvConfig(process.cwd());

const MARK = "Idris Vaurien";

async function main() {
  const { getDb } = await import("../src/lib/db");
  const { books, chapters, citizens, decrees, letters, offices, parchments, people, users } = await import("../src/lib/db/schema");

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL manquant dans .env.local.");
    process.exit(1);
  }

  const db = getDb();
  const already = await db.query.people.findFirst({ where: eq(people.name, MARK) });
  if (already) {
    console.log("Les données de démonstration sont déjà en place.");
    return;
  }

  const admin = await db.query.users.findFirst({
    where: eq(users.email, (process.env.ADMIN_EMAIL || "gardien@gaelia.local").toLowerCase()),
  });
  if (!admin) {
    console.error("Aucun gardien. Lance d'abord npm run db:seed.");
    process.exit(1);
  }

  const shelfRows = await db.query.shelves.findMany();
  const shelfId = new Map(shelfRows.map((shelf) => [shelf.slug, shelf.id]));

  const citizenSeed = [
    { name: "Idris Vaurien", epithet: "Celui qui a signé avec les racines", grade: "Gaelor", status: "actif", joinedOn: "2023-04-11", notes: "Porte la voix de la nation. Ne lève pas le capuchon en public." },
    { name: "Sève Lanme", epithet: "Main verte du conseil", grade: "Conseil", status: "actif", joinedOn: "2023-05-02", notes: "Tient les cueillettes, les serments de saison et les parchemins du Parvis." },
    { name: "Orin Cendre", epithet: "L'œil sur les frontières", grade: "Conseil", status: "en_mission", joinedOn: "2023-06-18", notes: "En pourparlers avec les Cendres. Revient à la prochaine lune." },
    { name: "Hélia Mousse", epithet: "Capitaine des sentinelles", grade: "Sentinelle", status: "actif", joinedOn: "2023-07-01", notes: "Garde les lisières. Parle peu, compte les feux." },
    { name: "Toren Val", epithet: "Tour nord", grade: "Sentinelle", status: "actif", joinedOn: "2024-01-20", notes: "Relève de nuit. A vu deux bêtes qui connaissaient son nom." },
    { name: "Bram Keller", epithet: "Plume des archives", grade: "Archiviste", status: "actif", joinedOn: "2023-09-09", notes: "Range les livres. Se dispute avec le gardien sur les degrés." },
    { name: "Noé Puy", epithet: "Herboriste", grade: "Herboriste", status: "absent", joinedOn: "2024-02-14", notes: "Parti chercher la fleur de lune close. N'a pas donné de date." },
    { name: "Lise Fange", epithet: "Apprentie des teintures", grade: "Apprentie", status: "actif", joinedOn: "2025-11-03", notes: "Apprend la noix et la ronce. N'ouvre pas les poisons." },
    { name: "Kael Dorr", epithet: "Ancien sentier", grade: "Exilé", status: "exile", joinedOn: "2023-04-11", notes: "A vendu un nom qui ne devait pas sortir de la racine. Le sceau lui est fermé." },
    { name: "Maëlle Ronce", epithet: "Tombée sous le bosquet", grade: "Sentinelle", status: "tombe", joinedOn: "2023-08-22", notes: "Morte à l'incendie du bosquet nord. Son office n'a pas été repris." },
  ];

  const citizenIds = new Map<string, string>();
  for (const row of citizenSeed) {
    const [created] = await db.insert(citizens).values(row).returning({ id: citizens.id, name: citizens.name });
    citizenIds.set(created.name, created.id);
  }

  let root = await db.query.offices.findFirst({ where: eq(offices.title, "Gaelor") });
  if (!root) {
    const [created] = await db
      .insert(offices)
      .values({
        title: "Gaelor",
        summary: "Chef de la nation. Signe avec les racines et porte la voix dehors.",
        sortOrder: 0,
        citizenId: citizenIds.get("Idris Vaurien"),
      })
      .returning();
    root = created;
  } else {
    await db
      .update(offices)
      .set({
        citizenId: citizenIds.get("Idris Vaurien"),
        summary: "Chef de la nation. Signe avec les racines et porte la voix dehors.",
      })
      .where(eq(offices.id, root.id));
  }

  const [conseilSeve] = await db
    .insert(offices)
    .values({
      parentId: root.id,
      citizenId: citizenIds.get("Sève Lanme"),
      title: "Conseil de la sève",
      summary: "Cueillettes, serments de saison, annonces clouées au Parvis.",
      sortOrder: 10,
    })
    .returning();
  await db.insert(offices).values([
    {
      parentId: root.id,
      citizenId: citizenIds.get("Orin Cendre"),
      title: "Conseil des frontières",
      summary: "Traités, émissaires, et ce qu'on laisse passer sous les arbres.",
      sortOrder: 20,
    },
    {
      parentId: root.id,
      citizenId: citizenIds.get("Bram Keller"),
      title: "Archives",
      summary: "Rayons, degrés, et la mémoire qu'on ne confie pas à la rumeur.",
      sortOrder: 30,
    },
    {
      parentId: root.id,
      citizenId: null,
      title: "Maître des bêtes",
      summary: "Place vacante depuis l'incendie. Les bêtes magiques n'ont plus de répondant.",
      sortOrder: 40,
    },
  ]);
  const [sentinelles] = await db
    .insert(offices)
    .values({
      parentId: root.id,
      citizenId: citizenIds.get("Hélia Mousse"),
      title: "Sentinelles",
      summary: "Les lisières, les feux, les tours.",
      sortOrder: 50,
    })
    .returning();
  await db.insert(offices).values([
    {
      parentId: sentinelles.id,
      citizenId: citizenIds.get("Toren Val"),
      title: "Tour nord",
      summary: "Veille de nuit sur le bosquet brûlé.",
      sortOrder: 10,
    },
    {
      parentId: sentinelles.id,
      citizenId: null,
      title: "Tour du saule",
      summary: "Place vacante. La tour regarde le comptoir, et personne ne la tient.",
      sortOrder: 20,
    },
    {
      parentId: conseilSeve.id,
      citizenId: citizenIds.get("Noé Puy"),
      title: "Herboristerie",
      summary: "Plantes ordinaires et pousses qui ignorent la saison. Le titulaire est absent.",
      sortOrder: 10,
    },
  ]);

  await db.insert(people).values([
    {
      name: "Idris Vaurien",
      nation: "Gaélia",
      office: "Gaelor",
      summary: "Signe les décrets. On le reconnaît à la lanterne, pas au visage.",
      notes: "Ne reçoit pas sans Sève ou Orin. Le capuchon reste bas, même au conseil.",
      featured: true,
      createdBy: admin.id,
    },
    {
      name: "Sève Lanme",
      nation: "Gaélia",
      office: "Conseillère de la sève",
      summary: "Fait clouer les parchemins et compte les récoltes avant les fêtes.",
      notes: "Répond plus vite que le Gaelor. C'est voulu.",
      featured: true,
      createdBy: admin.id,
    },
    {
      name: "Hélia Mousse",
      nation: "Gaélia",
      office: "Capitaine des sentinelles",
      summary: "Tient les tours. A fermé la lisière nord après l'incendie.",
      notes: "",
      featured: false,
      createdBy: admin.id,
    },
    {
      name: "Bram Keller",
      nation: "Gaélia",
      office: "Archiviste",
      summary: "Écrit ce que les autres oublient. Déteste les degrés posés au hasard.",
      notes: "Bureau sous les rayons des savoirs.",
      featured: false,
      createdBy: admin.id,
    },
    {
      name: "Marrec Holt",
      nation: "Les Cendres",
      office: "Émissaire",
      summary: "Vient traiter le tribut de bois et le passage des convois. Sourire trop propre pour un homme de cendre.",
      notes: "Ne pas le laisser seul dans l'allée des secrets. Orin s'en charge.",
      featured: true,
      createdBy: admin.id,
    },
    {
      name: "Aude Quill",
      nation: "Comptoir du Saule",
      office: "Patronne d'atelier",
      summary: "Vend lanternes, teintures et nouvelles. Le comptoir n'est pas gaélien, mais la moitié de la nation y doit quelque chose.",
      notes: "Lettre officielle en cours sur le prix de l'huile.",
      featured: false,
      createdBy: admin.id,
    },
    {
      name: "Elowen Marée",
      nation: "Cercle des Marées",
      office: "Oracle",
      summary: "Dit la marée et, parfois, le nom des morts avant qu'on les compte.",
      notes: "Invitée à la veillée. N'a pas de sceau.",
      featured: false,
      createdBy: admin.id,
    },
    {
      name: "Pask le Boiteux",
      nation: "Route des salines",
      office: "Contrebandier",
      summary: "Connaît un sentier que les sentinelles n'aiment pas. Utile, et à ne pas croire.",
      notes: "",
      featured: false,
      createdBy: admin.id,
    },
  ]);

  const bookSeed: Array<{
    slug: string;
    title: string;
    subtitle: string;
    summary: string;
    status: string;
    level: number;
    occurredOn?: string;
    chapters?: Array<{ title: string; body: string }>;
  }> = [
    {
      slug: "nations",
      title: "Les Cendres et leur tribut",
      subtitle: "Ce qu'on leur doit, et ce qu'on ne leur doit plus",
      summary: "Bois, passage des convois, et le vieux tribut que le décret G-07 a fait tomber.",
      status: "published",
      level: 1,
      occurredOn: "2026-03-02",
      chapters: [
        {
          title: "Le tribut",
          body: "Les Cendres prenaient un dixième du bois de lisière. Idris a signé la fin de cet usage.\n\nMarrec Holt sourit encore comme si le texte n'existait pas.\n\n> Un traité qui n'est pas cloué au Parvis n'est qu'une conversation.",
        },
        {
          title: "Ce qu'ils gardent",
          body: "Leur terre est brûlée volontairement, pour la cendre qui nourrit. Ils ne comprennent pas qu'on laisse un bosquet repousser seul.",
        },
      ],
    },
    {
      slug: "nations",
      title: "Le Cercle des Marées",
      subtitle: "Oracle, sel et noms dits trop tôt",
      summary: "Elowen annonce parfois un mort avant la sentinelle. On note, on ne confirme pas tout de suite.",
      status: "published",
      level: 2,
      occurredOn: "2026-01-19",
    },
    {
      slug: "entreprises",
      title: "Comptoir du Saule",
      subtitle: "Lanternes, huile, dettes",
      summary: "Aude Quill tient le comptoir. Gaélia y achète l'huile des veillées et y laisse trop d'ardoise.",
      status: "published",
      level: 1,
      occurredOn: "2025-12-08",
    },
    {
      slug: "entreprises",
      title: "Atelier des lanternes",
      subtitle: "Brouillon de Bram",
      summary: "Notes pas encore bonnes à publier sur qui forge le fer des lanternes de tour.",
      status: "draft",
      level: 1,
    },
    {
      slug: "evenements",
      title: "Veillée de la lune rousse",
      subtitle: "Chronique",
      summary: "La nation a marché jusqu'à la racine maîtresse. On a lu les noms, puis on a éteint les feux hors foyer.",
      status: "published",
      level: 1,
      occurredOn: "2026-09-12",
      chapters: [
        {
          title: "L'ordre de la nuit",
          body: "1. Les sentinelles ferment la lisière.\n2. Sève lit le parchemin.\n3. Le Gaelor ne parle qu'à la fin, et peu.\n\nOn a compté **quarante-deux** présents, et une place vide pour Maëlle.",
        },
      ],
    },
    {
      slug: "evenements",
      title: "Incendie du bosquet nord",
      subtitle: "Dossier clos, pas oublié",
      summary: "Le feu n'était pas un foyer autorisé. Maëlle Ronce est tombée en ramenant les apprentis.",
      status: "archived",
      level: 2,
      occurredOn: "2025-08-30",
    },
    {
      slug: "flore",
      title: "Mousse de veille",
      subtitle: "Usage ordinaire",
      summary: "Pousse sur l'écorce nord. Sert aux compresses et à reconnaître un sentier de nuit.",
      status: "published",
      level: 1,
      chapters: [
        {
          title: "Où la prendre",
          body: "Face nord, jamais au soleil de midi. Une poignée par tronc, pas plus.\n\n## À ne pas confondre\n\n- la mousse de veille est froide et sent la pluie\n- la mousse dorée pique la langue et n'est pas un remède",
        },
      ],
    },
    {
      slug: "flore",
      title: "Racine amère",
      subtitle: "Famine et tisane",
      summary: "On la mâche quand la cueillette est mauvaise. Elle tient éveillé et gâte le sommeil d'après.",
      status: "published",
      level: 1,
    },
    {
      slug: "faune",
      title: "Cerfs des clairières",
      subtitle: "Bêtes ordinaires",
      summary: "Ils descendent boire au saule. Les chasser pendant la veillée est interdit depuis G-12.",
      status: "published",
      level: 1,
    },
    {
      slug: "faune",
      title: "Loups de la route salée",
      subtitle: "Meutes et convois",
      summary: "Ils suivent les chargements de sel. Pask prétend les appeler. Hélia prétend que Pask ment.",
      status: "published",
      level: 2,
      occurredOn: "2026-02-02",
    },
    {
      slug: "flore-magique",
      title: "Sève qui rêve",
      subtitle: "Pousse hors saison",
      summary: "Coule en hiver sur trois chênes du bosquet. La lumière est faible, verte, et elle ne chauffe pas.",
      status: "published",
      level: 2,
      chapters: [
        {
          title: "Ce qu'on a mesuré",
          body: "Noé a noté ceci avant de partir :\n\n| Chêne | Heure | Lueur |\n| --- | --- | --- |\n| Le vieux | minuit | forte |\n| Le fendu | trois heures | faible |\n| Le brûlé | aucune | éteinte |\n\nLa sève du brûlé n'est pas revenue depuis l'incendie.",
        },
      ],
    },
    {
      slug: "flore-magique",
      title: "Fleur de lune close",
      subtitle: "On ne la cueille pas seul",
      summary: "S'ouvre une nuit par saison. Noé est parti la chercher sans escorte.",
      status: "published",
      level: 3,
    },
    {
      slug: "faune-magique",
      title: "Le gardien des souches",
      subtitle: "Créature de lisière",
      summary: "Pas le gardien des archives. Une bête basse, couverte de mousse, qui ne bouge que si on ment à voix haute.",
      status: "published",
      level: 2,
    },
    {
      slug: "faune-magique",
      title: "Bêtes qui connaissent les noms",
      subtitle: "Degré 4",
      summary: "Toren en a vu deux. Elles ont dit son nom avant qu'il parle. On ne les suit pas sous la racine.",
      status: "published",
      level: 4,
      occurredOn: "2026-06-21",
    },
    {
      slug: "artisanat",
      title: "Teinture à la noix",
      subtitle: "Geste d'apprentie",
      summary: "Lise teint les manteaux de sentinelle. La noix prend mieux après la pluie.",
      status: "published",
      level: 1,
      chapters: [
        {
          title: "Le bain",
          body: "Écraser les brous, pas les cerneaux. Laisser une nuit.\n\nLe manteau doit sortir **brun de sous-bois**, pas noir. Le noir, c'est une autre recette, et elle n'est pas pour les apprentis.",
        },
      ],
    },
    {
      slug: "artisanat",
      title: "Forge froide",
      subtitle: "Pas prêt",
      summary: "Bram a commencé une note sur le fer des lanternes. Il manque le nom du forgeron.",
      status: "draft",
      level: 2,
    },
    {
      slug: "poisons",
      title: "Ivresse de ronce",
      subtitle: "Savoir restreint",
      summary: "Une décoction qui délie la langue une heure, puis la ferme deux jours. Interdite hors du conseil.",
      status: "published",
      level: 3,
    },
    {
      slug: "poisons",
      title: "Poudre de lune noire",
      subtitle: "Ne pas sortir du rayon",
      summary: "Préparée avec la fleur close. Une pincée suffit à faire oublier un sentier. Le degré 4 est exigé.",
      status: "published",
      level: 4,
    },
    {
      slug: "recherche",
      title: "Notes sur la sève lumineuse",
      subtitle: "Travail en cours",
      summary: "Bram recopie les mesures de Noé. Rien ici n'est encore un savoir de la nation.",
      status: "draft",
      level: 2,
    },
    {
      slug: "secrets",
      title: "Noms qu'on ne dit pas",
      subtitle: "Degré 2",
      summary: "Une liste courte. Un initié peut la lire. Elle ne contient pas le pacte.",
      status: "published",
      level: 2,
      chapters: [
        {
          title: "La liste",
          body: "Trois noms ont été retirés de l'annuaire public. Ils restent ici pour que personne ne les réinvite par ignorance.\n\nKael Dorr est le seul encore en vie.",
        },
      ],
    },
    {
      slug: "secrets",
      title: "Cache sous la racine maîtresse",
      subtitle: "Degré 4",
      summary: "Où le conseil dépose ce qui ne doit pas brûler avec un bosquet.",
      status: "published",
      level: 4,
    },
    {
      slug: "secrets",
      title: "Le pacte du Gaelor",
      subtitle: "Degré 5",
      summary: "Ce qu'Idris a signé avec les racines, et ce que la nation doit rendre.",
      status: "published",
      level: 5,
      chapters: [
        {
          title: "Le serment",
          body: "La terre nourrit. La nation rend. Le texte exact n'est pas recopié dans un feuillet qu'on peut égarer.\n\nCe feuillet dit seulement ceci : qui ouvre le degré 5 sait déjà où est l'original, et ne le déplace pas.",
        },
      ],
    },
    {
      slug: "savoirs",
      title: "Coutume de la cueillette",
      subtitle: "Mémoire commune",
      summary: "On ne prend pas la dernière pousse. On laisse une offrande de pain si on coupe un jeune chêne.",
      status: "published",
      level: 1,
      occurredOn: "2024-05-01",
    },
  ];

  for (const book of bookSeed) {
    const id = shelfId.get(book.slug);
    if (!id) continue;
    const [created] = await db
      .insert(books)
      .values({
        shelfId: id,
        authorId: admin.id,
        title: book.title,
        subtitle: book.subtitle,
        summary: book.summary,
        status: book.status,
        level: book.level,
        occurredOn: book.occurredOn,
      })
      .returning({ id: books.id });
    if (book.chapters?.length) {
      await db.insert(chapters).values(
        book.chapters.map((chapter, index) => ({
          bookId: created.id,
          title: chapter.title,
          body: chapter.body,
          sortOrder: index,
        })),
      );
    }
  }

  await db.insert(decrees).values([
    {
      reference: "G-12",
      title: "Cueillette de la lune rousse",
      preamble: "Pour que la veillée ne dévore pas ce qui doit repousser.",
      body: "Pendant les trois nuits de la lune rousse, nul ne chasse, nul ne coupe un chêne, nul n'allume un feu hors des foyers marqués par les sentinelles.\n\nLa cueillette de mousse reste permise, une poignée par tronc.",
      status: "published",
      authorId: admin.id,
      publishedAt: new Date("2026-09-01T18:00:00.000Z"),
    },
    {
      reference: "G-13",
      title: "Feux hors foyer",
      preamble: "Après le bosquet nord.",
      body: "Tout feu allumé hors d'un foyer de pierre est un tort contre la nation. Les sentinelles peuvent l'éteindre sans autre avis.\n\nLe comptoir du Saule n'est pas un foyer de la nation.",
      status: "published",
      authorId: admin.id,
      publishedAt: new Date("2026-09-10T18:00:00.000Z"),
    },
    {
      reference: "G-07",
      title: "Tribut de bois aux Cendres",
      preamble: "Ancien usage, plus en vigueur.",
      body: "Un dixième du bois de lisière était dû aux Cendres. Cet article est abrogé. Le passage des convois se traite désormais sans tribut fixe.",
      status: "repealed",
      authorId: admin.id,
      publishedAt: new Date("2024-11-02T18:00:00.000Z"),
      repealedAt: new Date("2026-03-02T18:00:00.000Z"),
    },
    {
      reference: null,
      title: "Projet sur les bêtes qui parlent",
      preamble: "Pas encore promulgué.",
      body: "Le conseil hésite. Faut-il interdire de répondre quand une bête dit votre nom ? Toren demande une règle. Idris n'a pas signé.",
      status: "draft",
      authorId: admin.id,
    },
  ]);

  await db.insert(parchments).values([
    {
      title: "La sève a tourné",
      body: "Trois chênes ont donné de la sève lumineuse hors saison. Le brûlé est resté sec.\n\nNoé Puy est parti vers la fleur de lune close. Il n'emmène pas d'apprenti. Ceux qui le croisent sur un sentier le laissent passer et le notent au recensement comme absent, pas comme perdu.\n\nLa veillée reste à la date dite. On n'avance pas une fête parce que la terre s'impatiente.",
      pinned: false,
      status: "published",
      authorId: admin.id,
      publishedAt: new Date("2026-09-14T16:00:00.000Z"),
    },
    {
      title: "Veillée aux racines",
      body: "La veillée se tient à la racine maîtresse, à la tombée du jour. Les feux hors foyer sont déjà interdits : relisez G-13 avant de sortir une lampe à huile du comptoir.\n\nLes noms des absents seront lus. Maëlle aussi.",
      pinned: true,
      status: "published",
      authorId: admin.id,
      publishedAt: new Date("2026-09-18T16:00:00.000Z"),
    },
    {
      title: "Mot pour le conseil, pas encore cloué",
      body: "Orin veut qu'on prévienne les Cendres avant la veillée. Sève veut qu'on ne prévienne personne. Ce brouillon ne sort pas du cabinet.",
      pinned: false,
      status: "draft",
      authorId: admin.id,
    },
  ]);

  await db.insert(letters).values([
    {
      authorId: admin.id,
      subject: "Aux nations voisines, avant la veillée",
      body: "Gaélia tient sa veillée sur sa terre. Les convois patientent à la lisière ces trois nuits. Le tribut de bois n'est plus dû.\n\nCeux qui viennent en invités entrent sans arme de chasse. Elowen Marée est déjà attendue.",
      status: "published",
      publishedAt: new Date("2026-09-16T12:00:00.000Z"),
    },
    {
      authorId: admin.id,
      subject: "Au Comptoir du Saule",
      body: "Aude, l'huile des lanternes de tour sera payée à la prochaine cueillette, pas avant. Le décret sur les feux ne ferme pas ton comptoir. Il ferme les feux qu'on allume en chemin avec ton huile.\n\nNe vends pas de poudre. Tu sais laquelle.",
      status: "published",
      publishedAt: new Date("2026-09-20T12:00:00.000Z"),
    },
    {
      authorId: admin.id,
      subject: "Note au Gaelor, non publiée",
      body: "Idris, la place de maître des bêtes est vide depuis un an. Si tu ne la remplis pas avant l'hiver, les rayons de faune magique n'auront plus personne pour dire ce qui est vrai.",
      status: "draft",
    },
  ]);

  console.log("Données de démonstration insérées.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
