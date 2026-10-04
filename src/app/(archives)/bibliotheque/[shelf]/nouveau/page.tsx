import { redirect } from "next/navigation";
import { BookEditor } from "@/components/book-editor";
import { PageHeader } from "@/components/ui";
import { loadShelf } from "@/lib/books";
import { canWriteShelf, shelfLevel } from "@/lib/permissions";

export const metadata = { title: "Nouveau livre" };

export default async function NewBookPage({
  params,
  searchParams,
}: {
  params: Promise<{ shelf: string }>;
  searchParams: Promise<{ degre?: string }>;
}) {
  const { shelf: slug } = await params;
  const { degre = "1" } = await searchParams;
  const context = await loadShelf(slug);
  if (!context || !canWriteShelf(context.user, context.shelf.slug)) redirect("/bibliotheque");
  const maxLevel = shelfLevel(context.user, context.shelf.slug);
  const level = Math.min(maxLevel, Math.max(1, Number(degre) || 1));

  return (
    <div>
      <PageHeader kicker={context.shelf.name} title="Nouveau livre" lede="Le livre s’ouvre à gauche. La page que tu écris est à droite." />
      <BookEditor
        shelfId={context.shelf.id}
        maxLevel={maxLevel}
        initial={{ title: "", subtitle: "", summary: "", level, status: "draft", occurredOn: "", coverKey: null, chapters: [{ title: "Page 1", body: "" }] }}
      />
    </div>
  );
}
