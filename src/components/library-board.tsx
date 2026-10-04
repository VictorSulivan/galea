"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { bookCoverSrc } from "@/lib/book-cover";
import type { StageShelf } from "@/lib/books";
import { levelLabel } from "@/lib/permissions";
import { saveShelf } from "@/server/library";
import { Button, Field, inputClass } from "./ui";

const GRADES = [1, 2, 3, 4, 5] as const;

export function LibraryBoard({
  shelves,
  canManageShelves,
  children,
}: {
  shelves: StageShelf[];
  canManageShelves: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const parts = pathname.split("/").filter(Boolean);
  const reading = parts[0] === "bibliotheque" && parts.length > 2;
  const slug = parts[1];
  const filtered = slug ? shelves.find((shelf) => shelf.slug === slug) : null;
  const visible = filtered ? [filtered] : shelves;
  const [query, setQuery] = useState("");
  const [addingShelf, setAddingShelf] = useState(false);

  if (reading) return children;

  if (!shelves.length) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="font-serif text-xl text-sap">Aucun rayon ne t’est ouvert.</p>
        {canManageShelves ? <ShelfForm /> : null}
      </div>
    );
  }

  const needle = query.trim().toLowerCase();

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs uppercase tracking-[0.2em] text-gold">Registre</p>
      <h1 className="mt-2 font-display text-5xl tracking-tight">Bibliothèque</h1>
      <p className="mt-3 max-w-2xl text-sap">Chaque rayonnage a cinq étagères, du Novice au Gaelor. Un livre s’y pose en écrivant ses pages.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="flex min-w-[14rem] flex-1 flex-col gap-1 text-xs uppercase tracking-[0.16em] text-sap">
          Rayonnage
          <select
            value={filtered?.slug ?? ""}
            onChange={(event) => {
              const next = event.target.value;
              router.push(next ? `/bibliotheque/${next}` : "/bibliotheque");
            }}
            className="rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm normal-case tracking-normal text-parchment outline-none"
          >
            <option value="">Tous les rayons</option>
            {shelves.map((shelf) => (
              <option key={shelf.slug} value={shelf.slug}>
                {shelf.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs uppercase tracking-[0.16em] text-sap">
          Chercher
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={filtered ? "Dans ce rayon" : "Dans tes rayons"}
            className="rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm normal-case tracking-normal text-parchment outline-none placeholder:text-sap/60"
          />
        </label>
        {canManageShelves ? (
          <button
            type="button"
            onClick={() => setAddingShelf((value) => !value)}
            className="mt-5 rounded-full border border-gold/60 px-4 py-2 text-sm text-gold"
          >
            {addingShelf ? "Replier" : "Ajouter un rayonnage"}
          </button>
        ) : null}
        {filtered?.writable ? (
          <Link href={`/bibliotheque/${filtered.slug}/nouveau?degre=1`} className="mt-5 rounded-full bg-gold px-4 py-2 text-sm text-moss-deep">
            Nouveau livre
          </Link>
        ) : null}
      </div>

      {addingShelf ? <ShelfForm /> : null}

      <div className="mt-10 grid gap-12">
        {visible.map((shelf) => (
          <ShelfSection key={shelf.slug} shelf={shelf} needle={needle} showHeading={!filtered} />
        ))}
      </div>
    </div>
  );
}

function ShelfSection({
  shelf,
  needle,
  showHeading,
}: {
  shelf: StageShelf;
  needle: string;
  showHeading: boolean;
}) {
  return (
    <section>
      {showHeading ? (
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl">{shelf.name}</h2>
            <p className="mt-1 max-w-xl text-sm text-sap">{shelf.description}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gold">Ton degré · {levelLabel(shelf.level)}</p>
          </div>
          {shelf.writable ? (
            <Link href={`/bibliotheque/${shelf.slug}/nouveau?degre=1`} className="rounded-full bg-gold px-4 py-2 text-sm text-moss-deep">
              Nouveau livre
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mb-5">
          <h2 className="font-display text-3xl">{shelf.name}</h2>
          <p className="mt-1 max-w-xl text-sm text-sap">{shelf.description}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gold">Ton degré · {levelLabel(shelf.level)}</p>
        </div>
      )}

      <div className="grid gap-8">
        {GRADES.map((grade) => {
          const sealed = shelf.level < grade;
          const books = shelf.books.filter((book) => book.level === grade && (!needle || book.haystack.includes(needle)));
          return (
            <div key={grade}>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h3 className="font-display text-2xl text-parchment">{levelLabel(grade)}</h3>
                <p className="text-xs uppercase tracking-[0.16em] text-sap">{sealed ? "Fermé" : `${books.length} livre${books.length > 1 ? "s" : ""}`}</p>
              </div>
              {sealed ? <p className="font-serif text-sap">Cette étagère est au-dessus de ton degré.</p> : null}
              {!sealed && books.length === 0 ? (
                <p className="font-serif text-sap">
                  L’étagère est vide.
                  {shelf.writable ? (
                    <>
                      {" "}
                      <Link href={`/bibliotheque/${shelf.slug}/nouveau?degre=${grade}`} className="text-gold underline decoration-gold/40">
                        Poser un livre
                      </Link>
                    </>
                  ) : null}
                </p>
              ) : null}
              {!sealed && books.length > 0 ? (
                <div className="flex flex-wrap gap-6">
                  {books.map((book) => (
                    <Link key={book.id} href={`/bibliotheque/${shelf.slug}/${book.id}`} className="shelf-book">
                      <img src={bookCoverSrc(book.coverKey)} alt="" className="book-cover" />
                      <span className="shelf-book-title">{book.title}</span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ShelfForm() {
  return (
    <div className="form-sheet mt-5">
      <h2 className="font-display text-3xl">Nouveau rayonnage</h2>
      <p className="mt-2 text-sm text-ink-soft">Un nom suffit : Poisons, Cartes, Rites. Tu pourras y poser des livres ensuite.</p>
      <div className="mt-4">
        <ActionForm action={saveShelf}>
          <input type="hidden" name="back" value="bibliotheque" />
          <Field label="Nom">
            <input name="name" required className={inputClass} placeholder="Poisons" />
          </Field>
          <Field label="De quoi il parle">
            <textarea name="description" rows={3} className={inputClass} />
          </Field>
          <Field label="Qui peut l’approcher">
            <select name="sensitivity" defaultValue="restreint" className={inputClass}>
              <option value="ouvert">Ouvert</option>
              <option value="restreint">Restreint</option>
              <option value="secret">Secret</option>
            </select>
          </Field>
          <Button type="submit">Dresser le rayonnage</Button>
        </ActionForm>
      </div>
    </div>
  );
}
