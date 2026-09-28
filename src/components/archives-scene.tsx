"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { guardianScript, type GuideBeat, type GuidePlace, type GuideShelf } from "@/lib/guardian-script";
import { Dialogue, GuardianFace } from "./dialogue";

type TalkContextValue = {
  talk: (startId: string, news?: string[]) => void;
};

const TalkContext = createContext<TalkContextValue | null>(null);

export function useTalk() {
  const value = useContext(TalkContext);
  if (!value) throw new Error("Le gardien n'est pas dans cette salle.");
  return value;
}

export function ArchivesScene({
  name,
  title,
  places,
  shelves,
  children,
}: {
  name: string;
  title: string | null;
  places: GuidePlace[];
  shelves: GuideShelf[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [session, setSession] = useState<{ beats: GuideBeat[]; startId: string } | null>(null);
  const seenPath = useRef(pathname);
  const talk = useCallback(
    (startId: string, news?: string[]) => {
      setSession({ beats: guardianScript({ name, title, places, shelves, news }), startId });
    },
    [name, title, places, shelves],
  );
  const guide = useMemo(() => guardianScript({ name, title, places, shelves }), [name, title, places, shelves]);

  useEffect(() => {
    if (seenPath.current === pathname) return;
    seenPath.current = pathname;
    setSession(null);
  }, [pathname]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (session) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        setSession({ beats: guide, startId: "seuil" });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guide, session]);

  const segments = pathname.split("/").filter(Boolean);
  const walkingShelves = segments[0] === "bibliotheque" && segments.length < 3;

  return (
    <TalkContext.Provider value={{ talk }}>
      <div className="scene relative min-h-screen overflow-hidden">
        <header className="relative z-20 flex items-center justify-between px-5 py-4 md:px-8">
          <p className="font-display text-2xl text-parchment">Gaélia</p>
          <p className="text-right text-sm text-sap">
            <span className="block font-display text-lg text-parchment">{name}</span>
            {title}
          </p>
        </header>
        <div className={`relative px-4 pb-28 transition duration-500 md:px-8 ${session ? "pointer-events-none opacity-0" : ""}`}>{children}</div>
        {session ? <Dialogue beats={session.beats} startId={session.startId} onClose={() => setSession(null)} /> : null}
        <button
          type="button"
          onClick={() => setSession({ beats: guide, startId: "seuil" })}
          className="fixed bottom-4 left-4 z-30 flex items-end gap-2 text-left text-gold"
          aria-label="Parler au gardien"
        >
          <GuardianFace className="h-24 w-16" />
          <span className="mb-4 hidden max-w-28 text-xs uppercase tracking-[0.16em] sm:block">G · sous le capuchon</span>
        </button>
        <p className="pointer-events-none fixed bottom-4 right-4 z-30 max-w-xs text-right text-[11px] uppercase tracking-[0.16em] text-sap/80">
          {walkingShelves ? "← → un livre · ↑ ↓ l'étagère · Maj+↑ ↓ classer · Entrée · " : ""}G le gardien
        </p>
      </div>
    </TalkContext.Provider>
  );
}

export function Greet({ news }: { news?: string[] }) {
  const { talk } = useTalk();
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    talk("salut", news);
  }, [news, talk]);
  return null;
}
