"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/server/session";

export type Reply = {
  text: string;
  href?: string;
  beat?: string;
  logout?: boolean;
  close?: boolean;
};

export type Beat = {
  id: string;
  text: string;
  replies?: Reply[];
};

export function Dialogue({ beats, startId, onClose }: { beats: Beat[]; startId?: string; onClose: () => void }) {
  const router = useRouter();
  const start = Math.max(0, startId ? beats.findIndex((item) => item.id === startId) : 0);
  const [index, setIndex] = useState(start);
  const [shown, setShown] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [leaving, setLeaving] = useState<string | null>(null);
  const lineRef = useRef<HTMLButtonElement | null>(null);
  const beat = beats[index];
  const done = beat ? shown >= beat.text.length : true;
  const replies = done ? beat?.replies ?? [] : [];

  useEffect(() => {
    if (!beat || done) return;
    const timer = window.setTimeout(() => setShown((count) => count + 1), 16);
    return () => window.clearTimeout(timer);
  }, [beat, done, shown]);

  useEffect(() => {
    lineRef.current?.scrollIntoView({ block: "nearest" });
  }, [cursor, index]);

  function go(reply: Reply) {
    if (reply.close) {
      onClose();
      return;
    }
    if (reply.logout) {
      void logout();
      return;
    }
    if (reply.beat) {
      const next = beats.findIndex((item) => item.id === reply.beat);
      if (next >= 0) {
        setIndex(next);
        setShown(0);
        setCursor(0);
      }
      return;
    }
    if (reply.href) {
      setLeaving(reply.text);
      window.setTimeout(() => router.push(reply.href!), 420);
    }
  }

  function advance() {
    if (!beat) return;
    if (!done) {
      setShown(beat.text.length);
      return;
    }
    if (replies.length) {
      go(replies[Math.min(cursor, replies.length - 1)]);
      return;
    }
    if (index < beats.length - 1) {
      setIndex((value) => value + 1);
      setShown(0);
      setCursor(0);
      return;
    }
    onClose();
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        if (!replies.length) return;
        event.preventDefault();
        setCursor((value) => {
          const next = event.key === "ArrowDown" ? value + 1 : value - 1;
          return (next + replies.length) % replies.length;
        });
        return;
      }
      if (/^[1-9]$/.test(event.key) && replies.length) {
        const pick = Number(event.key) - 1;
        if (replies[pick]) {
          event.preventDefault();
          go(replies[pick]);
        }
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        advance();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!beat) return null;

  const crowded = replies.length > 4;

  return (
    <div data-dialogue="open" className="fixed inset-0 z-40 flex flex-col items-center justify-end px-4 pb-6">
      <div className="arrive flex w-full max-w-3xl flex-1 items-end justify-center pb-3">
        <GuardianFace
          className={`guardian-portrait w-auto max-w-[min(100%,26rem)] ${crowded ? "h-[42vh] max-h-[26rem]" : "h-[52vh] max-h-[34rem]"}`}
        />
      </div>
      <div className="speech-glass arrive w-full max-w-3xl rounded-[1.6rem] px-5 py-5 md:px-7">
        <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Sous le capuchon</p>
        {leaving ? (
          <p className="mt-2 font-serif text-2xl leading-snug text-parchment">Bon. Va. Et ne me remercie pas : je ne l’ai pas fait pour toi.</p>
        ) : (
          <>
            <p className="mt-2 min-h-16 font-serif text-2xl leading-snug text-parchment">
              {beat.text.slice(0, shown)}
              {done ? null : <span className="ml-1 inline-block h-5 w-2 animate-pulse bg-gold align-middle" />}
            </p>
            {replies.length ? (
              <>
                <div className="mt-4 grid max-h-72 gap-1 overflow-y-auto">
                  {replies.map((reply, replyIndex) => (
                    <button
                      key={`${reply.text}-${replyIndex}`}
                      ref={replyIndex === cursor ? lineRef : undefined}
                      type="button"
                      data-active={replyIndex === cursor}
                      className="dialogue-line rounded-xl px-3 py-2 font-serif text-lg text-parchment"
                      onMouseEnter={() => setCursor(replyIndex)}
                      onClick={() => go(reply)}
                    >
                      <span className="mr-3 font-sans text-xs tracking-widest text-gold">{replyIndex < 9 ? replyIndex + 1 : "·"}</span>
                      {reply.text}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-sap/80">↑ ↓ choisir · Entrée · 1 à 9 · Échap</p>
              </>
            ) : (
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-gold">Entrée. Il n’a pas fini de te juger.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function GuardianFace({ className = "h-24 w-16" }: { className?: string }) {
  return (
    <span className={`relative inline-block overflow-hidden ${className}`}>
      <img src="/gardien.png" alt="" className="h-full w-full object-cover object-[center_36%]" />
      <span className="pointer-events-none absolute left-[24%] right-[24%] top-[20%] h-[24%] rounded-[50%] bg-black/75 blur-md" />
    </span>
  );
}
