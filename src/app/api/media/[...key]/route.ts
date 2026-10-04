import { and, eq, ilike, or } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { assets, decrees, letters, shelves } from "@/lib/db/schema";
import { canReadShelf, canWriteShelf } from "@/lib/permissions";
import { readAsset, safeObjectKey, storageConfigured } from "@/lib/storage";

export const runtime = "nodejs";

async function publishedMentions(key: string) {
  const needle = `%${key}%`;
  const db = getDb();
  const [decreeRows, letterRows] = await Promise.all([
    db
      .select({ id: decrees.id })
      .from(decrees)
      .where(
        and(
          or(eq(decrees.status, "published"), eq(decrees.status, "repealed")),
          or(ilike(decrees.body, needle), ilike(decrees.preamble, needle)),
        ),
      )
      .limit(1),
    db
      .select({ id: letters.id })
      .from(letters)
      .where(and(eq(letters.status, "published"), ilike(letters.body, needle)))
      .limit(1),
  ]);
  return decreeRows.length + letterRows.length > 0;
}

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const user = await getCurrentUser();
  const { key: parts } = await context.params;
  const key = safeObjectKey(parts.join("/"));
  if (!key || !storageConfigured()) return new Response("Introuvable.", { status: 404 });

  const asset = await getDb().query.assets.findFirst({ where: eq(assets.key, key) });
  if (!asset) return new Response("Introuvable.", { status: 404 });

  if (!user) {
    if (asset.shelfId || !(await publishedMentions(key))) {
      return new Response("Sceau requis.", { status: 401 });
    }
  } else if (asset.shelfId) {
    const shelf = await getDb().query.shelves.findFirst({ where: eq(shelves.id, asset.shelfId) });
    if (!shelf || (!canReadShelf(user, shelf.slug) && !canWriteShelf(user, shelf.slug))) {
      return new Response("Sceau fermé.", { status: 403 });
    }
  }

  const file = await readAsset(key);
  if (!file) return new Response("Introuvable.", { status: 404 });

  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": asset.mime || file.mime,
      "Cache-Control": user ? "private, max-age=3600" : "public, max-age=3600",
    },
  });
}
