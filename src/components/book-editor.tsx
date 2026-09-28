"use client";

import { useState } from "react";
import { saveBook } from "@/server/library";
import { FileField } from "./file-field";
import { Markdown } from "./markdown";
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
  const [chapters, setChapters] = useState<Chapter[]>(initial.chapters.length ? initial.chapters : [{ title: "Premier feuillet", body: "" }]);
  const [active, setActive] = useState(0);
  const [preview, setPreview] = useState(false);
  const chapter = chapters[active] ?? chapters[0];

  function update(partial: Partial<Chapter>) {
    setChapters((current) => current.map((item, index) => (index === active ? { ...item, ...partial } : item)));
  }

  return (
    <ActionForm action={saveBook}>
      <input type="hidden" name="shelfId" value={shelfId} />
      <input type="hidden" name="bookId" value={bookId ?? ""} />
      <input type="hidden" name="chapters" value={JSON.stringify(chapters)} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Titre">
          <input name="title" required defaultValue={initial.title} className={inputClass} />
        </Field>
        <Field label="Sous-titre">
          <input name="subtitle" defaultValue={initial.subtitle} className={inputClass} />
        </Field>
      </div>
      <Field label="Résumé">
        <textarea name="summary" rows={3} defaultValue={initial.summary} className={inputClass} />
      </Field>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Statut">
          <select name="status" defaultValue={initial.status} className={inputClass}>
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
            <option value="archived">Archivé</option>
          </select>
        </Field>
        <Field label="Degré">
          <select name="level" defaultValue={String(Math.min(initial.level || 1, maxLevel))} className={inputClass}>
            {POWER_LEVELS.filter((item) => item.level >= 1 && item.level <= Math.max(1, maxLevel)).map((item) => (
              <option key={item.level} value={item.level}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date concernée">
          <input type="date" name="occurredOn" defaultValue={initial.occurredOn} className={inputClass} />
        </Field>
      </div>
      <FileField name="coverKey" label="Couverture" usage="livre" shelfId={shelfId} current={initial.coverKey} />
      <div className="flex flex-wrap gap-2">
        {chapters.map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActive(index)}
            className={`rounded-full px-3 py-1.5 text-sm ${index === active ? "bg-moss text-parchment" : "bg-white/60 text-ink"}`}
          >
            {item.title || `Feuillet ${index + 1}`}
          </button>
        ))}
        <button
          type="button"
          className="rounded-full border border-dashed border-gold-deep px-3 py-1.5 text-sm"
          onClick={() => {
            setChapters((current) => [...current, { title: `Feuillet ${current.length + 1}`, body: "" }]);
            setActive(chapters.length);
          }}
        >
          Ajouter un feuillet
        </button>
      </div>
      {chapter ? (
        <div className="grid gap-3">
          <Field label="Titre du feuillet">
            <input value={chapter.title} onChange={(event) => update({ title: event.target.value })} className={inputClass} />
          </Field>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setPreview((value) => !value)}>
              {preview ? "Revenir au texte" : "Aperçu"}
            </Button>
            {chapters.length > 1 ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  setChapters((current) => current.filter((_, index) => index !== active));
                  setActive(0);
                }}
              >
                Retirer ce feuillet
              </Button>
            ) : null}
          </div>
          {preview ? (
            <div className="rounded-2xl bg-white/50 p-5">
              <Markdown source={chapter.body} />
            </div>
          ) : (
            <textarea value={chapter.body} rows={16} onChange={(event) => update({ body: event.target.value })} className={inputClass} />
          )}
          <FileField
            label="Image dans le feuillet"
            usage="livre"
            shelfId={shelfId}
            onUploaded={(src) =>
              setChapters((current) =>
                current.map((item, index) =>
                  index === active ? { ...item, body: `${item.body}\n\n![illustration](${src})\n` } : item,
                ),
              )
            }
          />
        </div>
      ) : null}
      <Button type="submit">Enregistrer le livre</Button>
    </ActionForm>
  );
}
