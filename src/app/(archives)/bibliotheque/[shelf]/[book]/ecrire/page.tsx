import { notFound, redirect } from "next/navigation";
import { BookEditor } from "@/components/book-editor";
import { ActionForm } from "@/components/action-form";
import { Button, PageHeader, Panel } from "@/components/ui";
import { loadBook } from "@/lib/books";
import { canWriteBook, shelfLevel } from "@/lib/permissions";
import { deleteBook } from "@/server/library";

export const metadata = { title: "Écrire" };

export default async function WriteBookPage({ params }: { params: Promise<{ shelf: string; book: string }> }) {
  const { shelf, book } = await params;
  const context = await loadBook(shelf, book);
  if (!context) notFound();
  if (!canWriteBook(context.user, context.shelf.slug, context.book.level)) redirect(`/bibliotheque/${shelf}/${book}`);
  const ordered = [...context.book.chapters].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      <PageHeader kicker={context.shelf.name} title={context.book.title} lede="Les images partent dans le cellier Neon, puis s'insèrent dans le feuillet." />
      <Panel>
        <BookEditor
          shelfId={context.shelf.id}
          bookId={context.book.id}
          maxLevel={shelfLevel(context.user, context.shelf.slug)}
          initial={{
            title: context.book.title,
            subtitle: context.book.subtitle,
            summary: context.book.summary,
            level: context.book.level,
            status: context.book.status,
            occurredOn: context.book.occurredOn ?? "",
            coverKey: context.book.coverKey,
            chapters: ordered.map((chapter) => ({ title: chapter.title, body: chapter.body })),
          }}
        />
        <div className="mt-8 border-t border-[#eadcc0] pt-4">
          <ActionForm action={deleteBook}>
            <input type="hidden" name="id" value={context.book.id} />
            <Button type="submit" variant="danger">
              Retirer le livre
            </Button>
          </ActionForm>
        </div>
      </Panel>
    </div>
  );
}
