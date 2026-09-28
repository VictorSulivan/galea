import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

loadEnvConfig(process.cwd());

async function main() {
  const { getDb } = await import("../src/lib/db");
  const { books, chapters, grants, offices, parchments, shelves, users } = await import("../src/lib/db/schema");
  const { DEFAULT_SHELVES, allGrantKeys } = await import("../src/lib/permissions");

  const email = (process.env.ADMIN_EMAIL || "gardien@gaelia.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = process.env.ADMIN_NAME || "Gardien des archives";

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL manquant dans .env.local.");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("ADMIN_PASSWORD manquant ou trop court : 8 caractères minimum.");
    process.exit(1);
  }

  const db = getDb();

  for (const shelf of DEFAULT_SHELVES) {
    const existing = await db.query.shelves.findFirst({ where: eq(shelves.slug, shelf.slug) });
    if (!existing) await db.insert(shelves).values(shelf);
  }

  const shelfRows = await db.query.shelves.findMany();
  let admin = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!admin) {
    const [created] = await db
      .insert(users)
      .values({
        email,
        displayName: name,
        title: "Gardien technique",
        passwordHash: await bcrypt.hash(password, 12),
        isSuperAdmin: true,
        active: true,
      })
      .returning();
    admin = created;
  }

  const keys = allGrantKeys(
    shelfRows.map((shelf) => ({
      slug: shelf.slug,
      name: shelf.name,
      sensitivity: shelf.sensitivity as "ouvert" | "restreint" | "secret",
    })),
  );
  await db.delete(grants).where(eq(grants.userId, admin.id));
  if (keys.length) {
    await db.insert(grants).values(keys.map((grant) => ({ userId: admin.id, key: grant.key, level: grant.level })));
  }

  const root = await db.query.offices.findFirst({ where: eq(offices.title, "Gaelor") });
  if (!root) {
    await db.insert(offices).values({
      title: "Gaelor",
      summary: "Chef de la nation. Dresse l'organigramme et porte la voix de Gaélia.",
      sortOrder: 0,
    });
  }

  const savoirs = shelfRows.find((shelf) => shelf.slug === "savoirs");
  const charter = await db.query.books.findFirst({ where: eq(books.title, "Comment tenir les archives") });
  if (savoirs && !charter) {
    const [book] = await db
      .insert(books)
      .values({
        shelfId: savoirs.id,
        authorId: admin.id,
        title: "Comment tenir les archives",
        subtitle: "Charte intérieure",
        summary: "À quoi sert chaque salle, et comment un sceau ouvre ou ferme une porte.",
        status: "published",
        level: 1,
      })
      .returning();
    await db.insert(chapters).values({
      bookId: book.id,
      title: "Les portes",
      sortOrder: 0,
      body: [
        "Gaélia garde ici ce qu'elle ne veut pas laisser se dissoudre : les gens, les faits, les savoirs, les décrets.",
        "",
        "L'annuaire nomme les personnes importantes du serveur, y compris hors de la nation. Le recensement ne compte que les membres de Gaélia. L'organigramme dit qui occupe quel office, et seul le Gaelor ou un sceau autorisé le redresse.",
        "",
        "La bibliothèque est faite de rayons. Chaque écrit a un degré de 1 à 5. Qui a le degré 2 sur les secrets lit les secrets 1 et 2, et pas le 5.",
        "",
        "Les décrets, les parchemins et les lettres officielles sont rédigés par le Gaelor et le Conseil. Une fois publiés, ils sont lus sur le Parvis, par les Gaéliens comme par les visiteurs.",
        "",
        "Un modèle (citoyen, archiviste, chercheur, scribe, conseil, Gaelor) pose des degrés de départ. Ensuite, chaque section se règle une à une.",
      ].join("\n"),
    });
  } else if (charter) {
    const door = await db.query.chapters.findFirst({ where: eq(chapters.bookId, charter.id) });
    if (door?.body.includes("case est cochée")) {
      await db
        .update(chapters)
        .set({
          body: [
            "Gaélia garde ici ce qu'elle ne veut pas laisser se dissoudre : les gens, les faits, les savoirs, les décrets.",
            "",
            "L'annuaire nomme les personnes importantes du serveur, y compris hors de la nation. Le recensement ne compte que les membres de Gaélia. L'organigramme dit qui occupe quel office, et seul le Gaelor ou un sceau autorisé le redresse.",
            "",
            "La bibliothèque est faite de rayons. Chaque écrit a un degré de 1 à 5. Qui a le degré 2 sur les secrets lit les secrets 1 et 2, et pas le 5.",
            "",
            "Les décrets, les parchemins et les lettres officielles sont rédigés par le Gaelor et le Conseil. Une fois publiés, ils sont lus sur le Parvis, par les Gaéliens comme par les visiteurs.",
            "",
            "Un modèle (citoyen, archiviste, chercheur, scribe, conseil, Gaelor) pose des degrés de départ. Ensuite, chaque section se règle une à une.",
          ].join("\n"),
        })
        .where(eq(chapters.id, door.id));
    }
  }

  const notice = await db.query.parchments.findFirst({ where: eq(parchments.title, "Les archives sont ouvertes") });
  if (!notice) {
    await db.insert(parchments).values({
      title: "Les archives sont ouvertes",
      body: "Le Hall, l'annuaire, la bibliothèque et le recensement attendent ce que la nation voudra y déposer. Les images des livres se rangent dans le cellier Neon.",
      pinned: true,
      authorId: admin.id,
    });
  }

  console.log(`Gardien prêt : ${email}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
