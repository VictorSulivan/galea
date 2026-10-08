"use client";

import { useState } from "react";
import { DEFAULT_BOOK_COVER } from "@/lib/book-cover";
import {
  PAGE_BODY_LINES_MAX,
  PAGE_BODY_MAX,
  PAGE_TITLE_MAX,
  clampPageBody,
  pageLineCount,
  pageOverflowMessage,
  pageVisualLineCount,
} from "@/lib/book-page";
import { saveBook } from "@/server/library";
import { FileField } from "./file-field";
import { BookPageSurface } from "./book-page-surface";
import { PageImagePanel } from "./page-image-panel";
import { ActionForm } from "./action-form";
import { POWER_LEVELS } from "@/lib/permissions";
import { Button, Field, inputClass } from "./ui";

type Chapter = { title: string; body: string };

export function BookEditor({
  shelfId,
  bookId,
  maxLevel,
  initial,
}: {
  shelfId: string;
  bookId?: string;
  maxLevel: number;
  initial: {
    title: string;
    subtitle: string;
    summary: string;
    level: number;
    status: string;
    occurredOn: string;
    coverKey: string | null;
    chapters: Chapter[];
  };
}) {
  const [chapters, setChapters] = useState<Chapter[]>(
    initial.chapters.length
      ? initial.chapters.map((item) => ({ title: item.title.slice(0, PAGE_TITLE_MAX), body: clampPageBody(item.body) }))
      : [{ title: "Page 1", body: "" }],
  );
  const [active, setActive] = useState(0);
  const [limitNotice, setLimitNotice] = useState("");
  const chapter = chapters[active] ?? chapters[0];
  const overflow = pageOverflowMessage(chapters);
  const chars = chapter?.body.length ?? 0;
  const lines = chapter ? Math.max(pageLineCount(chapter.body), pageVisualLineCount(chapter.body)) : 0;

  function openPage(index: number) {
    setLimitNotice("");
    setActive(index);
  }

  function patchActive(partial: Partial<Chapter>) {
    if (partial.body !== undefined) {
      const clamped = clampPageBody(partial.body);
      if (clamped !== partial.body) {
        setLimitNotice(`Feuillet limité à ${PAGE_BODY_MAX} caractères et ${PAGE_BODY_LINES_MAX} lignes.`);
      } else {
        setLimitNotice("");
      }
      partial = { ...partial, body: clamped };
    } else {
      setLimitNotice("");
    }
    setChapters((current) =>
      current.map((item, index) => {
        if (index !== active) return item;
        return {
          title: partial.title !== undefined ? partial.title.slice(0, PAGE_TITLE_MAX) : item.title,
          body: partial.body !== undefined ? partial.body : item.body,
        };
      }),
    );
  }

  return (
    <ActionForm action={saveBook}>
      <input type="hidden" name="shelfId" value={shelfId} />
      <input type="hidden" name="bookId" value={bookId ?? ""} />
      <input type="hidden" name="chapters" value={JSON.stringify(chapters)} />
      <div className="codex">
        <div className="codex-spread">
          <div className="codex-page">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold-deep">Le livre</p>
            <div className="mt-3 grid gap-3">
              <Field label="Titre">
                <input name="title" required defaultValue={initial.title} className={inputClass} />
              </Field>
              <Field label="Sous-titre">
                <input name="subtitle" defaultValue={initial.subtitle} className={inputClass} />
              </Field>
              <Field label="Résumé">
                <textarea name="summary" rows={2} defaultValue={initial.summary} className={inputClass} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Statut">
                  <select name="status" defaultValue={initial.status} className={inputClass}>
                    <option value="draft">Brouillon</option>
                    <option value="published">Publié</option>
                    <option value="archived">Archivé</option>
                  </select>
                </Field>
                <Field label="Étagère">
                  <select name="level" defaultValue={String(Math.min(initial.level || 1, maxLevel))} className={inputClass}>
                    {POWER_LEVELS.filter((item) => item.level >= 1 && item.level <= Math.max(1, maxLevel)).map((item) => (
                      <option key={item.level} value={item.level}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Date concernée">
                <input type="date" name="occurredOn" defaultValue={initial.occurredOn} className={inputClass} />
              </Field>
              <FileField name="coverKey" label="Couverture" usage="livre" shelfId={shelfId} current={initial.coverKey} fallback={DEFAULT_BOOK_COVER} />
            </div>
            <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-gold-deep">Pages</p>
            <ol className="mt-2 grid gap-1">
              {chapters.map((item, index) => (
                <li key={index}>
                  <button type="button" data-on={index === active ? "true" : "false"} className="codex-page-link font-serif" onClick={() => openPage(index)}>
                    <span className="mr-2 text-gold-deep">{index + 1}</span>
                    {item.title || `Page ${index + 1}`}
                  </button>
                </li>
              ))}
            </ol>
            <button
              type="button"
              className="mt-3 text-sm text-gold-deep underline decoration-gold/40"
              onClick={() => {
                const index = chapters.length;
                setChapters((current) => [...current, { title: `Page ${current.length + 1}`, body: "" }]);
                openPage(index);
              }}
            >
              Nouvelle page
            </button>
          </div>

          {chapter ? (
            <div className="codex-page flex flex-col">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gold-deep">
                  Page {active + 1} sur {chapters.length}
                </p>
                <div className="flex gap-3 text-sm">
                  <button
                    type="button"
                    className={`text-gold-deep ${active === 0 ? "pointer-events-none opacity-40" : ""}`}
                    aria-disabled={active === 0}
                    onClick={() => {
                      if (active === 0) return;
                      openPage(active - 1);
                    }}
                  >
                    Précédente
                  </button>
                  <button
                    type="button"
                    className={`text-gold-deep ${active >= chapters.length - 1 ? "pointer-events-none opacity-40" : ""}`}
                    aria-disabled={active >= chapters.length - 1}
                    onClick={() => {
                      if (active >= chapters.length - 1) return;
                      openPage(active + 1);
                    }}
                  >
                    Suivante
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <Field label="Titre de la page">
                  <input
                    value={chapter.title}
                    maxLength={PAGE_TITLE_MAX}
                    onChange={(event) => patchActive({ title: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Texte de la page">
                  <textarea
                    key="book-page-body-a4"
                    value={chapter.body}
                    rows={22}
                    maxLength={PAGE_BODY_MAX}
                    onChange={(event) => patchActive({ body: event.target.value })}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      if (pageLineCount(chapter.body) >= PAGE_BODY_LINES_MAX) {
                        event.preventDefault();
                        setLimitNotice(`Maximum ${PAGE_BODY_LINES_MAX} lignes par feuillet.`);
                      }
                    }}
                    placeholder={`Feuillet A4 · ${PAGE_BODY_MAX} caractères et ${PAGE_BODY_LINES_MAX} lignes maximum.`}
                    className={`${inputClass} book-page-compose`}
                  />
                </Field>
              </div>

              <p className={`mt-2 text-xs ${chars >= PAGE_BODY_MAX || lines >= PAGE_BODY_LINES_MAX ? "text-clay" : "text-ink-soft"}`}>
                {chars}/{PAGE_BODY_MAX} caractères · {lines}/{PAGE_BODY_LINES_MAX} lignes
              </p>
              {limitNotice ? <p className="mt-1 text-sm text-clay">{limitNotice}</p> : null}
              {overflow ? <p className="mt-1 text-sm text-clay">{overflow}</p> : null}

              <div className="mt-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gold-deep">Feuillet</p>
                <div className="mt-2">
                  <BookPageSurface
                    kicker={`Page ${active + 1}${chapters.length ? ` sur ${chapters.length}` : ""}`}
                    title={chapter.title || "Page"}
                    body={chapter.body}
                    editable
                    shelfId={shelfId}
                    onChange={(body) => patchActive({ body })}
                    onNotice={setLimitNotice}
                  />
                </div>
              </div>

              <PageImagePanel
                shelfId={shelfId}
                body={chapter.body}
                onChange={(body) => patchActive({ body })}
                onNotice={setLimitNotice}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {chapters.length > 1 ? (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      setChapters((current) => current.filter((_, index) => index !== active));
                      openPage(Math.max(0, active - 1));
                    }}
                  >
                    Retirer cette page
                  </Button>
                ) : null}
              </div>
              <Button type="submit" className="mt-4" disabled={Boolean(overflow)}>
                Enregistrer le livre
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </ActionForm>
  );
}
