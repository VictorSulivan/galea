import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { loadBook } from "@/lib/books";
import { BOOK_STATUS, formatDate, formatDay } from "@/lib/format";
import { canWriteBook } from "@/lib/permissions";
import { mediaPath } from "@/lib/storage";

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
  const { feuillet = "0" } = await searchParams;
  const context = await loadBook(shelf, bookId);
  if (!context) notFound();
  const ordered = [...context.book.chapters].sort((a, b) => a.sortOrder - b.sortOrder);
  const index = Math.min(Math.max(Number(feuillet) || 0, 0), Math.max(ordered.length - 1, 0));
  const chapter = ordered[index];

  return (
    <div>
      <PageHeader
        kicker={context.shelf.name}
        title={context.book.title}
        lede={context.book.subtitle || context.book.summary}
        action={
          canWriteBook(context.user, context.shelf.slug, context.book.level) ? (
            <Link href={`/bibliotheque/${context.shelf.slug}/${context.book.id}/ecrire`} className="rounded-full border border-gold/50 px-4 py-2 text-sm text-gold">
              Reprendre la plume
            </Link>
          ) : null
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-sap">
        <Badge>Degré {context.book.level}</Badge>
        <Badge tone={context.book.status === "published" ? "leaf" : "gold"}>{BOOK_STATUS[context.book.status] ?? context.book.status}</Badge>
        <span>{context.book.author?.displayName ?? "Main anonyme"}</span>
        {context.book.occurredOn ? <span>{formatDay(context.book.occurredOn)}</span> : null}
        <span>Mis à jour {formatDate(context.book.updatedAt)}</span>
      </div>
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <aside className="grid content-start gap-2">
          {ordered.map((item, itemIndex) => (
            <Link
              key={item.id}
              href={`/bibliotheque/${context.shelf.slug}/${context.book.id}?feuillet=${itemIndex}`}
              className={`rounded-2xl px-3 py-2 text-sm ${itemIndex === index ? "bg-gold text-moss-deep" : "text-parchment/80 hover:bg-white/5"}`}
            >
              {item.title}
            </Link>
          ))}
        </aside>
        <Panel>
          {context.book.coverKey && index === 0 ? (
            <img src={mediaPath(context.book.coverKey)} alt="" className="mb-6 max-h-80 w-full rounded-2xl object-cover" />
          ) : null}
          <h2 className="font-display text-4xl">{chapter?.title}</h2>
          {chapter ? <Markdown source={chapter.body || "*Ce feuillet est encore blanc.*"} /> : <p>Ce livre n’a pas encore de feuillet.</p>}
        </Panel>
      </div>
    </div>
  );
}
