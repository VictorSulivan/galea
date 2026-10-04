"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useMemo, useState, useTransition } from "react";
import { Markdown } from "@/components/markdown";
import { bookCoverSrc } from "@/lib/book-cover";
import { BOOK_STATUS, formatDate, formatDay } from "@/lib/format";

type Chapter = {
  id: string;
  title: string;
  body: string;
};

type Leaf =
  | { kind: "front" }
  | { kind: "chapter"; chapter: Chapter; number: number }
  | { kind: "blank" };

type Face = "front" | "open" | "back";

export function BookReader({
  shelfName,
  shelfSlug,
  bookId,
  writable,
  coverKey,
  title,
  subtitle,
  summary,
  status,
  level,
  occurredOn,
  author,
  updatedAt,
  chapters,
  initialFace,
  initialLeaf,
}: {
  shelfName: string;
  shelfSlug: string;
  bookId: string;
  writable: boolean;
  coverKey: string | null;
  title: string;
  subtitle: string;
  summary: string;
  status: string;
  level: number;
  occurredOn: string | null;
  author: string;
  updatedAt: string;
  chapters: Chapter[];
  initialFace: Face;
  initialLeaf: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const leaves = useMemo<Leaf[]>(() => {
    const list: Leaf[] = [{ kind: "front" }, ...chapters.map((chapter, index) => ({ kind: "chapter" as const, chapter, number: index + 1 }))];
    if (list.length % 2 === 1) list.push({ kind: "blank" });
    return list;
  }, [chapters]);

  const maxLeaf = Math.max(leaves.length - 1, 0);
  const lastSpread = Math.floor(maxLeaf / 2) * 2;
  const [face, setFace] = useState<Face>(initialFace);
  const [leaf, setLeaf] = useState(() => Math.min(Math.max(initialLeaf, 0), maxLeaf));
  const [turning, setTurning] = useState<"next" | "prev" | null>(null);

  const spread = Math.floor(leaf / 2) * 2;
  const left = leaves[spread];
  const right = leaves[spread + 1];
  const atEnd = face === "open" && spread >= lastSpread;
  const base = `/bibliotheque/${shelfSlug}/${bookId}`;

  function syncUrl(nextFace: Face, nextLeaf: number) {
    const href =
      nextFace === "front" ? base : nextFace === "back" ? `${base}?feuillet=dos` : `${base}?feuillet=${nextLeaf}`;
    startTransition(() => router.replace(href, { scroll: false }));
  }

  const showFace = useEffectEvent((nextFace: Face, nextLeaf = 0) => {
    setFace(nextFace);
    setLeaf(nextLeaf);
    setTurning(null);
    syncUrl(nextFace, nextLeaf);
  });

  const turn = useEffectEvent((direction: "next" | "prev") => {
    if (turning) return;

    if (face === "front") {
      if (direction === "next") {
        setTurning("next");
        window.setTimeout(() => showFace("open", 0), 420);
      }
      return;
    }

    if (face === "back") {
      if (direction === "prev") {
        setTurning("prev");
        window.setTimeout(() => showFace("open", lastSpread), 420);
      } else {
        setTurning("next");
        window.setTimeout(() => showFace("front", 0), 420);
      }
      return;
    }

    if (direction === "prev") {
      if (spread === 0) {
        setTurning("prev");
        window.setTimeout(() => showFace("front", 0), 420);
        return;
      }
      const nextLeaf = Math.max(spread - 2, 0);
      setTurning("prev");
      window.setTimeout(() => showFace("open", nextLeaf), 420);
      return;
    }

    if (spread >= lastSpread) {
      setTurning("next");
      window.setTimeout(() => showFace("back", 0), 420);
      return;
    }

    const nextLeaf = spread + 2;
    setTurning("next");
    window.setTimeout(() => showFace("open", nextLeaf), 420);
  });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        turn("next");
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        turn("prev");
      }
      if (event.key === "Escape" && face !== "front") {
        event.preventDefault();
        showFace(face === "open" && spread >= lastSpread ? "back" : "front");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [face, spread, lastSpread, turn, showFace]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/bibliotheque/${shelfSlug}`} className="text-sm text-gold">
          Retour à {shelfName}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {face === "open" ? (
            <button type="button" onClick={() => showFace(atEnd ? "back" : "front")} className="text-sm text-gold">
              {atEnd ? "Fermer · 4e de couverture" : "Fermer le livre"}
            </button>
          ) : null}
          {face === "back" ? (
            <button type="button" onClick={() => showFace("front")} className="text-sm text-gold">
              Première de couverture
            </button>
          ) : null}
          {writable ? (
            <Link href={`${base}/ecrire`} className="rounded-full border border-gold/50 px-4 py-2 text-sm text-gold">
              Écrire les pages
            </Link>
          ) : null}
        </div>
      </div>

      <div className={`reader-stage ${face === "open" ? "is-open" : ""}`}>
        <div className="reader-plinth" aria-hidden="true">
          <div className="reader-plinth-shelf" />
          <div className="reader-plinth-column" />
          <div className="reader-plinth-foot" />
          <div className="reader-plinth-moss" />
        </div>

        {face === "front" ? (
          <button
            type="button"
            className={`reader-bound reader-bound-front ${turning ? "is-turning" : ""}`}
            onClick={() => turn("next")}
            aria-label={`Ouvrir ${title}`}
          >
            <span className="reader-bound-spine" />
            <img src={bookCoverSrc(coverKey)} alt="" className="reader-bound-image" />
            <span className="reader-bound-title">{title}</span>
            <span className="reader-bound-hint">Ouvrir le livre</span>
          </button>
        ) : null}

        {face === "back" ? (
          <button
            type="button"
            className={`reader-bound reader-bound-back ${turning ? "is-turning" : ""}`}
            onClick={() => turn("prev")}
            aria-label="Rouvrir le livre"
          >
            <span className="reader-bound-spine reader-bound-spine-back" />
            <span className="reader-back-seal">
              <img src="/gaelia/bouclier.png" alt="" />
            </span>
            <span className="reader-back-kicker">{shelfName}</span>
            {summary ? <span className="reader-back-summary">{summary}</span> : <span className="reader-back-summary">{subtitle || title}</span>}
            <span className="reader-back-meta">
              {author}
              <br />
              {BOOK_STATUS[status] ?? status} · degré {level}
              {occurredOn ? ` · ${formatDay(occurredOn)}` : ""}
            </span>
            <span className="reader-bound-hint">Rouvrir · ou tourner pour la couverture</span>
          </button>
        ) : null}

        {face === "open" ? (
          <div className={`reader-open ${turning === "next" ? "is-turning-next" : ""} ${turning === "prev" ? "is-turning-prev" : ""}`}>
            <button type="button" className="reader-turn reader-turn-left" onClick={() => turn("prev")} aria-label="Page précédente" disabled={turning !== null} />
            <article className="reader-book">
              <div className="reader-book-cover-edge reader-book-cover-edge-left" />
              <div className="reader-spread">
                <div className="reader-page">
                  {left ? (
                    <LeafView
                      leaf={left}
                      title={title}
                      subtitle={subtitle}
                      summary={summary}
                      status={status}
                      level={level}
                      occurredOn={occurredOn}
                      author={author}
                      updatedAt={updatedAt}
                      shelfName={shelfName}
                      total={chapters.length}
                    />
                  ) : null}
                </div>
                <div className="reader-page">
                  {right ? (
                    <LeafView
                      leaf={right}
                      title={title}
                      subtitle={subtitle}
                      summary={summary}
                      status={status}
                      level={level}
                      occurredOn={occurredOn}
                      author={author}
                      updatedAt={updatedAt}
                      shelfName={shelfName}
                      total={chapters.length}
                    />
                  ) : null}
                </div>
              </div>
              <div className="reader-book-cover-edge reader-book-cover-edge-right" />
              <div className="reader-flip" aria-hidden="true" />
            </article>
            <button type="button" className="reader-turn reader-turn-right" onClick={() => turn("next")} aria-label="Page suivante" disabled={turning !== null} />
          </div>
        ) : null}

        <div className="reader-nav">
          <button
            type="button"
            onClick={() => turn("prev")}
            className="reader-nav-btn"
            disabled={turning !== null || face === "front"}
          >
            ← Tourner
          </button>
          <p className="reader-nav-count">
            {face === "front"
              ? "Première de couverture"
              : face === "back"
                ? "Quatrième de couverture"
                : chapters.length
                  ? `Feuillets ${spread + 1}–${Math.min(spread + 2, leaves.length)}`
                  : "Livre vide"}
          </p>
          <button type="button" onClick={() => turn("next")} className="reader-nav-btn" disabled={turning !== null}>
            {face === "back" ? "Couverture →" : atEnd ? "Fermer →" : "Tourner →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LeafView({
  leaf,
  title,
  subtitle,
  summary,
  status,
  level,
  occurredOn,
  author,
  updatedAt,
  shelfName,
  total,
}: {
  leaf: Leaf;
  title: string;
  subtitle: string;
  summary: string;
  status: string;
  level: number;
  occurredOn: string | null;
  author: string;
  updatedAt: string;
  shelfName: string;
  total: number;
}) {
  if (leaf.kind === "blank") {
    return <p className="reader-blank">Page blanche</p>;
  }

  if (leaf.kind === "front") {
    return (
      <div>
        <p className="reader-kicker">{shelfName}</p>
        <h1 className="reader-title">{title}</h1>
        {subtitle ? <p className="reader-subtitle">{subtitle}</p> : null}
        {summary ? <p className="reader-summary">{summary}</p> : null}
        <p className="reader-kicker reader-kicker-spaced">
          {BOOK_STATUS[status] ?? status} · degré {level}
          {occurredOn ? ` · ${formatDay(occurredOn)}` : ""}
        </p>
        <p className="reader-meta">
          {author} · {formatDate(updatedAt)}
        </p>
        <p className="reader-kicker reader-kicker-spaced">
          {total ? `${total} page${total > 1 ? "s" : ""}` : "Aucune page"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <p className="reader-kicker">
        Page {leaf.number}
        {total ? ` sur ${total}` : ""}
      </p>
                  <h2 className="reader-chapter">{leaf.chapter.title}</h2>
                  <div className="book-leaf-body">
                    <Markdown source={leaf.chapter.body || "*Cette page est encore blanche.*"} />
                  </div>
    </div>
  );
}
