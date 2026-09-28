"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SENSITIVITY } from "@/lib/format";

export type AisleShelf = {
  slug: string;
  name: string;
  description: string;
  sensitivity: string;
  level: number;
  writable: boolean;
};

export type AisleFind = {
  id: string;
  title: string;
  slug: string;
  name: string;
};

export function Aisle({
  shelves,
  finds,
  query,
}: {
  shelves: AisleShelf[];
  finds: AisleFind[];
  query: string;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [findIndex, setFindIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [word, setWord] = useState(query);
  const looking = finds.length > 0;
  const shelf = shelves[index];

  function step(direction: -1 | 1) {
    if (looking) {
      setFindIndex((value) => (value + direction + finds.length) % finds.length);
      return;
    }
    setIndex((value) => Math.min(shelves.length - 1, Math.max(0, value + direction)));
  }

  function approach() {
    if (looking) {
      const found = finds[findIndex];
      if (found) router.push(`/bibliotheque/${found.slug}/${found.id}`);
      return;
    }
    if (shelf) router.push(`/bibliotheque/${shelf.slug}`);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (document.querySelector("[data-dialogue]")) return;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        step(event.key === "ArrowRight" ? 1 : -1);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        approach();
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        setListening(true);
      }
      if (event.key === "Escape" && (looking || query)) {
        event.preventDefault();
        router.push("/bibliotheque");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!shelf) {
    return (
      <p className="arrive mx-auto max-w-xl pt-24 text-center font-serif text-2xl text-sap">
        Aucun rayon pour toi. Il hausse un sourcil, comme s’il s’y attendait.
      </p>
    );
  }

  return (
    <>
      <LibraryHall shift={index * -2.2} />
      <div className="fixed inset-x-0 bottom-32 z-10 px-5 md:px-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-gold">
          {looking
            ? `Il a entendu « ${query} »`
            : query
              ? `Rien sous « ${query} »`
              : `${SENSITIVITY[shelf.sensitivity] ?? shelf.sensitivity} · degré ${shelf.level}`}
        </p>
        {looking ? (
          <div className="mt-4 max-w-xl">
            {finds.map((found, foundIndex) => (
              <button
                key={found.id}
                type="button"
                data-active={foundIndex === findIndex}
                className="dialogue-line rounded-xl px-3 py-2 font-serif text-xl text-parchment"
                onMouseEnter={() => setFindIndex(foundIndex)}
                onClick={() => router.push(`/bibliotheque/${found.slug}/${found.id}`)}
              >
                {found.name} — {found.title}
              </button>
            ))}
          </div>
        ) : (
          <button type="button" onClick={approach} className="mt-3 max-w-3xl text-left">
            <span className="block font-display text-5xl text-parchment drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)] md:text-7xl">{shelf.name}</span>
            <span className="mt-3 block max-w-lg font-serif text-lg text-parchment/90 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">{shelf.description}</span>
            <span className="mt-4 block text-[11px] uppercase tracking-[0.16em] text-sap">
              {index > 0 ? "← " : ""}
              {index < shelves.length - 1 ? "→ " : ""}
              Entrée pour t’approcher
              {shelf.writable ? " · tu peux écrire ici" : ""}
            </span>
          </button>
        )}
        {listening ? (
          <form action="/bibliotheque" className="mt-6 max-w-md">
            <label className="block font-serif text-xl text-parchment">Il tend l’oreille, à contrecœur. Quel nom ?</label>
            <input
              name="q"
              autoFocus
              value={word}
              onChange={(event) => setWord(event.target.value)}
              className="mt-3 w-full border-0 border-b border-gold/50 bg-transparent py-2 font-serif text-2xl text-parchment outline-none"
            />
          </form>
        ) : null}
      </div>
    </>
  );
}

export function LibraryHall({ shift = 0 }: { shift?: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1]" aria-hidden>
      <div className="absolute inset-[-8%] transition-transform duration-700 ease-out" style={{ transform: `translate3d(${shift}%, 0, 0)` }}>
        <img src="/allee-livres.png" alt="" className="h-full w-full object-cover" />
        <div className="library-fire" />
        <div className="library-fire-core" />
        <div className="library-flame" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-black/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
    </div>
  );
}
