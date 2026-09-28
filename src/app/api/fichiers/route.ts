import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { assets, shelves } from "@/lib/db/schema";
import { can, canVoice, canWriteShelf } from "@/lib/permissions";
import { extensionFor, mediaPath, putAsset, storageConfigured } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Session expirée." }, { status: 401 });
  if (!storageConfigured()) {
    return Response.json(
      { error: "Le cellier Neon n'est pas configuré. Renseigne NEON_STORAGE_ENDPOINT, NEON_STORAGE_BUCKET et les clés dans .env.local." },
      { status: 503 },
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  const usage = form.get("usage");
  const shelfValue = form.get("shelfId");
  const shelfId = typeof shelfValue === "string" ? shelfValue : "";
  if (!(file instanceof File)) return Response.json({ error: "Image manquante." }, { status: 400 });
  const extension = extensionFor(file.type);
  if (!extension) return Response.json({ error: "Formats acceptés : jpg, png, webp, gif." }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return Response.json({ error: "L'image dépasse 8 Mo." }, { status: 400 });

  let folder = "pieces";
  let linkedShelf: string | null = null;

  if (usage === "portrait") {
    if (!can(user, "annuaire.ecrire") && !can(user, "recensement.ecrire")) {
      return Response.json({ error: "Tu ne peux pas déposer de portrait." }, { status: 403 });
    }
    folder = "portraits";
  } else if (usage === "livre") {
    const shelf = shelfId ? await getDb().query.shelves.findFirst({ where: eq(shelves.id, shelfId) }) : null;
    if (!shelf || !canWriteShelf(user, shelf.slug)) {
      return Response.json({ error: "Ce rayon ne t'est pas ouvert à l'écriture." }, { status: 403 });
    }
    folder = "livres";
    linkedShelf = shelf.id;
  } else if (usage === "piece") {
    if (!canVoice(user)) return Response.json({ error: "Tu ne peux pas déposer cette image." }, { status: 403 });
  } else {
    return Response.json({ error: "Usage inconnu." }, { status: 400 });
  }

  const key = `${folder}/${crypto.randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  await putAsset(key, bytes, file.type);
  await getDb().insert(assets).values({
    key,
    mime: file.type,
    shelfId: linkedShelf,
    uploadedBy: user.id,
  });

  return Response.json({ key, src: mediaPath(key) });
}
