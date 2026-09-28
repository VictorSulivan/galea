"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BOOK_STATUS, SENSITIVITY, formatDay } from "@/lib/format";
import type { StageBook, StageShelf } from "@/lib/books";
import { POWER_LEVELS } from "@/lib/permissions";
import { placeBook } from "@/server/library";
import { LibraryHall } from "./aisle";

const GRADES = [5, 4, 3, 2, 1] as const;

const LEATHERS = [
  { leather: "#5a2c22", deep: "#2a120e" },
  { leather: "#2c3a2e", deep: "#121a14" },
  { leather: "#4a341c", deep: "#24180c" },
  { leather: "#2e2a40", deep: "#16141f" },
  { leather: "#6a341c", deep: "#2c160c" },
  { leather: "#4a2430", deep: "#240e16" },
];

const STEP = "11rem";
const HALF = "5.125rem";

type PlacedBook = StageBook & { shelfSlug: string; shelfName: string };

export function LibraryStage({ shelves, children }: { shelves: StageShelf[]; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const [, startTransition] = useTransition();
  const parts = pathname.split("/").filter(Boolean);
  const reading = parts[0] === "bibliotheque" && parts.length > 2;
  const known = !parts[1] || shelves.some((shelf) => shelf.slug === parts[1]);
  const walking = !reading && known;

  const [index, setIndex] = useState(() => {
    const found = shelves.findIndex((shelf) => shelf.slug === parts[1]);
    return found >= 0 ? found : 0;
  });
  const [places, setPlaces] = useState<Record<string, number>>({});
  const [gradeFocus, setGradeFocus] = useState<Record<string, number>>({});
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState("");
  const [hoverGrade, setHoverGrade] = useState<number | null>(null);
  const [findCursor, setFindCursor] = useState(0);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [word, setWord] = useState(query);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const indexRef = useRef(index);
  const placesRef = useRef(places);
  const focusRef = useRef(gradeFocus);
  const overridesRef = useRef(overrides);
  const findRef = useRef(findCursor);
  const dragRef = useRef({ x: 0, y: 0, dx: 0, dy: 0, on: false, bookId: "" });
  const dragged = useRef(false);
  const openingRef = useRef<string | null>(null);
  const readingRef = useRef(reading);
  const shelvesRef = useRef(shelves);
  const queryRef = useRef(query);
  indexRef.current = index;
  placesRef.current = places;
  focusRef.current = gradeFocus;
  overridesRef.current = overrides;
  findRef.current = findCursor;
  readingRef.current = reading;
  shelvesRef.current = shelves;
  queryRef.current = query;

  const shelf = shelves[index];
  const finds: PlacedBook[] | null = query
    ? shelves.flatMap((item) =>
        item.books
          .filter((book) => book.status === "published" && book.haystack.includes(query.toLowerCase()))
          .map((book) => ({ ...book, shelfSlug: item.slug, shelfName: item.name })),
      )
    : null;

  function remember(slug: string) {
    const next = `/bibliotheque/${slug}`;
    if (window.location.pathname === next) return;
    startTransition(() => router.replace(next, { scroll: false }));
  }

  function bookGrade(book: StageBook) {
    return overridesRef.current[book.id] ?? book.level;
  }

  function gradeRow(shelf: StageShelf, grade: number) {
    return shelf.books.filter((book) => bookGrade(book) === grade);
  }

  function stepBook(direction: -1 | 1, times = 1) {
    if (queryRef.current) {
      const total = shelvesRef.current.reduce(
        (count, item) => count + item.books.filter((book) => book.status === "published" && book.haystack.includes(queryRef.current.toLowerCase())).length,
        0,
      );
      if (!total) return;
      const cursor = Math.min(total - 1, Math.max(0, findRef.current + direction * times));
      findRef.current = cursor;
      setFindCursor(cursor);
      return;
    }
    let cursor = indexRef.current;
    const nextPlaces = { ...placesRef.current };
    const nextFocus = { ...focusRef.current };
    const list = shelvesRef.current;
    for (let step = 0; step < times; step += 1) {
      const current = list[cursor];
      if (!current) break;
      const grade = nextFocus[current.slug] ?? 1;
      const row = gradeRow(current, grade);
      const key = `${current.slug}:${grade}`;
      const place = nextPlaces[key] ?? 0;
      const following = place + direction;
      if (row.length > 0 && following >= 0 && following < row.length) {
        nextPlaces[key] = following;
        continue;
      }
      const neighbor = cursor + direction;
      if (neighbor < 0 || neighbor >= list.length) break;
      cursor = neighbor;
      const target = list[cursor];
      nextFocus[target.slug] = grade;
      const targetRow = gradeRow(target, grade);
      nextPlaces[`${target.slug}:${grade}`] = direction > 0 ? 0 : Math.max(0, targetRow.length - 1);
    }
    placesRef.current = nextPlaces;
    focusRef.current = nextFocus;
    indexRef.current = cursor;
    setPlaces(nextPlaces);
    setGradeFocus(nextFocus);
    setIndex(cursor);
    const landed = list[cursor];
    if (landed) remember(landed.slug);
  }

  function stepGrade(direction: -1 | 1) {
    if (queryRef.current) {
      stepBook(direction);
      return;
    }
    const current = shelvesRef.current[indexRef.current];
    if (!current) return;
    const grade = focusRef.current[current.slug] ?? 1;
    const next = Math.min(5, Math.max(1, grade + direction));
    if (next === grade) return;
    const focus = { ...focusRef.current, [current.slug]: next };
    focusRef.current = focus;
    setGradeFocus(focus);
    setNotice("");
  }

  function moveBookTo(book: PlacedBook, next: number) {
    const shelf = shelvesRef.current.find((item) => item.slug === book.shelfSlug);
    const current = overridesRef.current[book.id] ?? book.level;
    if (!shelf || next === current) return;
    if (!shelf.writable || shelf.level < current) {
      setNotice("Tu ne peux pas déplacer ce livre.");
      return;
    }
    if (next < 1 || next > shelf.level) {
      setNotice("Cette étagère est au-dessus de ton degré.");
      return;
    }
    const nextOverrides = { ...overridesRef.current, [book.id]: next };
    const row = shelf.books.filter((item) => (nextOverrides[item.id] ?? item.level) === next);
    const at = Math.max(0, row.findIndex((item) => item.id === book.id));
    const focus = { ...focusRef.current, [shelf.slug]: next };
    const nextPlaces = { ...placesRef.current, [`${shelf.slug}:${next}`]: at };
    overridesRef.current = nextOverrides;
    focusRef.current = focus;
    placesRef.current = nextPlaces;
    setOverrides(nextOverrides);
    setGradeFocus(focus);
    setPlaces(nextPlaces);
    setNotice("");
    startTransition(() => {
      void placeBook(book.id, next).then((result) => {
        if (!result.error) {
          router.refresh();
          return;
        }
        const reverted = { ...overridesRef.current };
        delete reverted[book.id];
        overridesRef.current = reverted;
        setOverrides(reverted);
        setNotice(result.error);
      });
    });
  }

  function openBook(book: PlacedBook) {
    if (openingRef.current) return;
    openingRef.current = book.id;
    setOpeningId(book.id);
    window.setTimeout(() => {
      router.push(`/bibliotheque/${book.shelfSlug}/${book.id}`);
    }, 320);
  }

  useEffect(() => {
    setFindCursor(0);
    findRef.current = 0;
  }, [query]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (readingRef.current) return;
      if (document.querySelector("[data-dialogue]")) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        stepBook(event.key === "ArrowRight" ? 1 : -1);
      }
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        const direction = event.key === "ArrowUp" ? 1 : -1;
        if (event.shiftKey) {
          const current = currentBook();
          if (current) moveBookTo(current, (overridesRef.current[current.id] ?? current.level) + direction);
          return;
        }
        stepGrade(direction);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const current = currentBook();
        if (current) openBook(current);
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        setListening(true);
      }
      if (event.key === "Escape" && (queryRef.current || listening)) {
        event.preventDefault();
        setListening(false);
        startTransition(() => router.replace("/bibliotheque", { scroll: false }));
      }
      if ((event.key === "n" || event.key === "N") && !queryRef.current) {
        const current = shelvesRef.current[indexRef.current];
        if (current?.writable) {
          event.preventDefault();
          const grade = focusRef.current[current.slug] ?? 1;
          router.push(`/bibliotheque/${current.slug}/nouveau?degre=${grade}`);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function currentBook(): PlacedBook | null {
    if (queryRef.current) {
      const needle = queryRef.current.toLowerCase();
      const list = shelvesRef.current.flatMap((item) =>
        item.books
          .filter((book) => book.status === "published" && book.haystack.includes(needle))
          .map((book) => ({ ...book, shelfSlug: item.slug, shelfName: item.name })),
      );
      return list[findRef.current] ?? null;
    }
    const current = shelvesRef.current[indexRef.current];
    if (!current) return null;
    const grade = focusRef.current[current.slug] ?? 1;
    const book = gradeRow(current, grade)[placesRef.current[`${current.slug}:${grade}`] ?? 0];
    if (!book) return null;
    return { ...book, level: bookGrade(book), shelfSlug: current.slug, shelfName: current.name };
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const bookId = (event.target as HTMLElement).closest<HTMLElement>("[data-book]")?.dataset.book ?? "";
    dragRef.current = { x: event.clientX, y: event.clientY, dx: 0, dy: 0, on: true, bookId };
    dragged.current = false;
    setDragging(true);
    setHoverGrade(null);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.on) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current.dx = dx;
    dragRef.current.dy = dy;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) dragged.current = true;
    const vertical = Math.abs(dy) > Math.abs(dx);
    setDragX(vertical ? 0 : dx);
    if (!vertical) {
      setHoverGrade(null);
      return;
    }
    const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-grade]");
    setHoverGrade(hit ? Number(hit.dataset.grade) : null);
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.on) return;
    const { dx, dy, bookId } = dragRef.current;
    dragRef.current.on = false;
    setDragging(false);
    setDragX(0);
    setHoverGrade(null);
    if (bookId && Math.abs(dy) > 28 && Math.abs(dy) > Math.abs(dx)) {
      const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-grade]");
      const level = Number(hit?.dataset.grade);
      const book = currentBook();
      const carried = book?.id === bookId ? book : findPlaced(bookId);
      if (carried && level >= 1 && level <= 5) moveBookTo(carried, level);
      return;
    }
    const width = event.currentTarget.querySelector(".tome")?.getBoundingClientRect().width ?? 130;
    const steps = Math.round(-dx / (width + 8));
    if (steps !== 0) stepBook(steps > 0 ? 1 : -1, Math.abs(steps));
  }

  function findPlaced(bookId: string): PlacedBook | null {
    for (const item of shelvesRef.current) {
      const book = item.books.find((entry) => entry.id === bookId);
      if (book) return { ...book, level: bookGrade(book), shelfSlug: item.slug, shelfName: item.name };
    }
    return null;
  }

  function placeOn(item: StageShelf, book: StageBook): PlacedBook {
    return { ...book, level: overrides[book.id] ?? book.level, shelfSlug: item.slug, shelfName: item.name };
  }

  function chooseBook(slug: string, level: number, book: PlacedBook, bookIndex: number, place: number) {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    if ((gradeFocus[slug] ?? 1) !== level || bookIndex !== place) {
      const focus = { ...gradeFocus, [slug]: level };
      const nextPlaces = { ...places, [`${slug}:${level}`]: bookIndex };
      focusRef.current = focus;
      placesRef.current = nextPlaces;
      setGradeFocus(focus);
      setPlaces(nextPlaces);
      return;
    }
    openBook(book);
  }

  if (!walking) return children;
  if (!shelf) {
    return <p className="pt-24 text-center font-serif text-2xl text-parchment">Aucun rayon pour toi.</p>;
  }

  const focusGrade = gradeFocus[shelf.slug] ?? 1;
  const shown = finds ?? gradeRow(shelf, focusGrade).map((book) => placeOn(shelf, book));
  const cursor = finds ? Math.min(findCursor, Math.max(0, shown.length - 1)) : (places[`${shelf.slug}:${focusGrade}`] ?? 0);
  const active = shown[Math.min(cursor, Math.max(0, shown.length - 1))] ?? null;

  return (
    <>
      <LibraryHall shift={index * -3.4} />
      <div className="fixed inset-x-0 top-[4.5rem] bottom-24 z-10 flex flex-col">
        <div className="relative min-h-0 flex-1">
          <div className="absolute inset-0 overflow-hidden">
          <div className="library-track flex h-full" style={{ transform: `translate3d(${finds ? 0 : -index * 100}%, 0, 0)` }}>
            {(finds ? [shelf] : shelves).map((item, itemIndex) => {
              const live = finds ? true : itemIndex === index;
              const itemGrade = gradeFocus[item.slug] ?? 1;
              return (
                <section key={finds ? "recherche" : item.slug} className="flex h-full w-full shrink-0 flex-col">
                  <div className="shrink-0 px-6 md:px-10">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-gold">
                      {finds
                        ? `Il a entendu « ${query} »`
                        : `${SENSITIVITY[item.sensitivity] ?? item.sensitivity} · jusqu'au degré ${item.level}`}
                      {item.writable && !finds ? " · N sur cette étagère" : ""}
                    </p>
                    <h1 className="mt-1 font-display text-3xl text-parchment drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)] md:text-5xl">
                      {finds ? "Dans les reliures" : item.name}
                    </h1>
                  </div>
                  {finds ? (
                    <FindRow
                      row={shown}
                      place={cursor}
                      dragging={dragging}
                      dragX={dragX}
                      openingId={openingId}
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onChoose={(book, bookIndex) => {
                        if (dragged.current) {
                          dragged.current = false;
                          return;
                        }
                        if (bookIndex !== cursor) {
                          setFindCursor(bookIndex);
                          return;
                        }
                        openBook(book);
                      }}
                    />
                  ) : (
                    <div
                      className="grade-case min-h-0 px-3 md:px-6"
                      onPointerDown={live ? onPointerDown : undefined}
                      onPointerMove={live ? onPointerMove : undefined}
                      onPointerUp={live ? onPointerUp : undefined}
                    >
                      {GRADES.map((level) => {
                        const sealed = level > item.level;
                        const focused = live && itemGrade === level;
                        const row = gradeRow(item, level).map((book) => placeOn(item, book));
                        const place = places[`${item.slug}:${level}`] ?? 0;
                        const label = POWER_LEVELS.find((entry) => entry.level === level)?.label ?? String(level);
                        return (
                          <div key={level} data-grade={level} className={`grade-row ${focused ? "grade-live" : ""} ${sealed ? "grade-sealed" : ""} ${hoverGrade === level ? "grade-target" : ""}`}>
                            <p className="grade-label">{label}</p>
                            <div className="relative h-full min-w-0">
                              {sealed ? (
                                <p className="absolute bottom-3 left-2 font-serif text-sm text-parchment/70">Au-dessus de ton degré.</p>
                              ) : row.length === 0 ? (
                                <p className="absolute bottom-3 left-2 font-serif text-sm text-parchment/70">Cette étagère attend.</p>
                              ) : focused ? (
                                <div className="absolute inset-0 overflow-hidden">
                                  <div
                                    className={`library-row absolute left-1/2 flex h-full items-end ${dragging ? "library-row-drag" : ""}`}
                                    style={{ transform: `translate3d(calc(${place} * -1 * var(--tome-step) - var(--tome-half) + ${dragX}px), 0, 0)` }}
                                  >
                                    {row.map((book, bookIndex) => (
                                      <Tome
                                        key={book.id}
                                        book={book}
                                        distance={Math.abs(bookIndex - place)}
                                        active={bookIndex === place}
                                        opening={openingId === book.id}
                                        onChoose={() => chooseBook(item.slug, level, book, bookIndex, place)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="absolute inset-0 flex items-end overflow-hidden pb-3">
                                  {row.map((book, bookIndex) => (
                                    <Spine key={book.id} book={book} onChoose={() => chooseBook(item.slug, level, book, bookIndex, place)} />
                                  ))}
                                </div>
                              )}
                              <div className="library-ledge" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
          </div>
        </div>
        <p className="h-8 shrink-0 px-6 text-center font-serif text-parchment/90 md:px-10">
          {notice
            ? notice
            : active
              ? `${finds ? `${active.shelfName} · ` : ""}${active.author} · ${POWER_LEVELS.find((entry) => entry.level === active.level)?.label ?? `degré ${active.level}`} · ${BOOK_STATUS[active.status] ?? active.status}${active.occurredOn ? ` · ${formatDay(active.occurredOn)}` : ""}`
              : ""}
        </p>
        {listening ? (
          <form
            className="mx-auto mt-2 max-w-md px-6"
            onSubmit={(event) => {
              event.preventDefault();
              setListening(false);
              startTransition(() => router.replace(`/bibliotheque?q=${encodeURIComponent(word.trim())}`, { scroll: false }));
            }}
          >
            <label className="block text-center font-serif text-xl text-parchment">Il tend l’oreille, à contrecœur. Quel nom ?</label>
            <input
              name="q"
              autoFocus
              value={word}
              onChange={(event) => setWord(event.target.value)}
              className="mt-2 w-full border-0 border-b border-gold/50 bg-transparent py-2 text-center font-serif text-2xl text-parchment outline-none"
            />
          </form>
        ) : null}
      </div>
    </>
  );
}

function Tome({
  book,
  distance,
  active,
  opening,
  showShelf = false,
  onChoose,
}: {
  book: PlacedBook;
  distance: number;
  active: boolean;
  opening: boolean;
  showShelf?: boolean;
  onChoose: () => void;
}) {
  const dye = LEATHERS[leatherIndex(book.id)];
  const pose = opening
    ? "translateY(-0.7rem) scale(1.04)"
    : active
      ? "translateY(-0.28rem) scale(1.02)"
      : `scale(${Math.max(0.9, 0.98 - distance * 0.03)})`;
  return (
    <button
      type="button"
      className="tome"
      data-book={book.id}
      data-active={active}
      aria-current={active ? "true" : undefined}
      aria-label={book.title}
      onClick={onChoose}
      style={
        {
          transform: pose,
          opacity: active ? 1 : Math.max(0.55, 1 - distance * 0.12),
          zIndex: active ? 2 : 1,
          "--leather": dye.leather,
          "--deep": dye.deep,
        } as React.CSSProperties
      }
    >
      <span className="tome-spine" />
      <span className="tome-cover">
        <span className="tome-frame">
          <span className="tome-rule" />
          <span className="tome-title">{book.title}</span>
          {book.subtitle ? <span className="tome-subtitle">{book.subtitle}</span> : null}
          {showShelf ? <span className="tome-subtitle">{book.shelfName}</span> : null}
          <span className="tome-rule" />
        </span>
      </span>
      <span className="tome-pages" />
    </button>
  );
}

function Spine({ book, onChoose }: { book: PlacedBook; onChoose: () => void }) {
  const dye = LEATHERS[leatherIndex(book.id)];
  return (
    <button
      type="button"
      className="spine"
      data-book={book.id}
      aria-label={book.title}
      onClick={onChoose}
      style={{ "--leather": dye.leather, "--deep": dye.deep } as React.CSSProperties}
    >
      <span className="spine-title">{book.title}</span>
    </button>
  );
}

function FindRow({
  row,
  place,
  dragging,
  dragX,
  openingId,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onChoose,
}: {
  row: PlacedBook[];
  place: number;
  dragging: boolean;
  dragX: number;
  openingId: string | null;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onChoose: (book: PlacedBook, bookIndex: number) => void;
}) {
  return (
    <div className="relative mt-5 h-[19rem] touch-none" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      {row.length === 0 ? (
        <p className="px-6 font-serif text-2xl text-parchment md:px-10">Rien sous ce nom. Il n’a pas l’air surpris.</p>
      ) : (
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={`library-row absolute left-1/2 flex h-full items-end ${dragging ? "library-row-drag" : ""}`}
            style={{ transform: `translate3d(calc(${place} * -1 * ${STEP} - ${HALF} + ${dragX}px), 0, 0)` }}
          >
            {row.map((book, bookIndex) => (
              <Tome
                key={book.id}
                book={book}
                distance={Math.abs(bookIndex - place)}
                active={bookIndex === place}
                opening={openingId === book.id}
                showShelf
                onChoose={() => onChoose(book, bookIndex)}
              />
            ))}
          </div>
        </div>
      )}
      <div className="library-ledge" />
    </div>
  );
}

function leatherIndex(id: string) {
  let value = 0;
  for (const char of id) value = (value + char.charCodeAt(0)) % LEATHERS.length;
  return value;
}
