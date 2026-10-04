import { notFound } from "next/navigation";
import { BookReader } from "@/components/book-reader";
import { loadBook } from "@/lib/books";
import { canWriteBook } from "@/lib/permissions";

export async function generateMetadata({ params }: { params: Promise<{ shelf: string; book: string }> }) {
  const { shelf, book } = await params;
  const context = await loadBook(shelf, book);
  return { title: context?.book.title ?? "Livre" };
}

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ shelf: string; book: string }>;
  searchParams: Promise<{ feuillet?: string }>;
}) {
  const { shelf, book: bookId } = await params;
  const { feuillet } = await searchParams;
  const context = await loadBook(shelf, bookId);
  if (!context) notFound();

  const ordered = [...context.book.chapters].sort((a, b) => a.sortOrder - b.sortOrder);
  const initialFace = feuillet === "dos" ? "back" : feuillet === undefined || feuillet === "" ? "front" : "open";
  const initialLeaf = initialFace === "open" ? Math.max(0, Number(feuillet) || 0) : 0;
  const writable = canWriteBook(context.user, context.shelf.slug, context.book.level);

  return (
    <BookReader
      shelfName={context.shelf.name}
      shelfSlug={context.shelf.slug}
      bookId={context.book.id}
      writable={writable}
      coverKey={context.book.coverKey}
      title={context.book.title}
      subtitle={context.book.subtitle}
      summary={context.book.summary}
      status={context.book.status}
      level={context.book.level}
      occurredOn={context.book.occurredOn}
      author={context.book.author?.displayName ?? "Main anonyme"}
      updatedAt={context.book.updatedAt.toISOString()}
      chapters={ordered.map((chapter) => ({ id: chapter.id, title: chapter.title, body: chapter.body }))}
      initialFace={initialFace}
      initialLeaf={initialLeaf}
    />
  );
}
