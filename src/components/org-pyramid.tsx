"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ActionForm } from "@/components/action-form";
import { Button, Field, Mark } from "@/components/ui";
import { deleteOffice, saveOffice } from "@/server/nation";

export type OrgNode = {
  id: string;
  parentId: string | null;
  title: string;
  summary: string;
  sortOrder: number;
  citizenId: string | null;
  citizenName: string | null;
  superiorName: string | null;
};

type Seat = OrgNode & { x: number; y: number; w: number; h: number; depth: number };

const GAP_X = 36;
const GAP_Y = 72;

function orderedChildren(nodes: OrgNode[], parentId: string | null) {
  return nodes
    .filter((node) => node.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "fr"));
}

function seatSize(depth: number) {
  if (depth === 0) return { w: 248, h: 124 };
  if (depth === 1) return { w: 208, h: 116 };
  return { w: 196, h: 108 };
}

function layout(nodes: OrgNode[]): Seat[] {
  const widths = new Map<string, number>();
  function widthOf(id: string): number {
    const cached = widths.get(id);
    if (cached) return cached;
    const { w } = seatSize(depthOf(id));
    const kids = orderedChildren(nodes, id);
    const span = kids.reduce((sum, kid) => sum + widthOf(kid.id), 0) + Math.max(0, kids.length - 1) * GAP_X;
    const value = Math.max(w, span);
    widths.set(id, value);
    return value;
  }

  const depths = new Map<string, number>();
  function depthOf(id: string): number {
    const cached = depths.get(id);
    if (cached !== undefined) return cached;
    const node = nodes.find((item) => item.id === id);
    const value = node?.parentId ? depthOf(node.parentId) + 1 : 0;
    depths.set(id, value);
    return value;
  }

  const seats: Seat[] = [];
  function place(id: string, left: number) {
    const node = nodes.find((item) => item.id === id);
    if (!node) return;
    const depth = depthOf(id);
    const size = seatSize(depth);
    const span = widthOf(id);
    const kids = orderedChildren(nodes, id);
    const y = depth * (size.h + GAP_Y + depth * 8);
    seats.push({ ...node, ...size, depth, x: left + span / 2, y: y + size.h / 2 });
    let cursor = left + (span - (kids.reduce((sum, kid) => sum + widthOf(kid.id), 0) + Math.max(0, kids.length - 1) * GAP_X)) / 2;
    for (const kid of kids) {
      place(kid.id, cursor);
      cursor += widthOf(kid.id) + GAP_X;
    }
  }

  let cursor = 0;
  for (const root of orderedChildren(nodes, null)) {
    place(root.id, cursor);
    cursor += widthOf(root.id) + GAP_X * 2;
  }
  return seats;
}

export function OrgPyramid({
  nodes,
  citizens,
  writable,
  initialId,
}: {
  nodes: OrgNode[];
  citizens: { id: string; name: string; superiorId: string | null }[];
  writable: boolean;
  initialId?: string;
}) {
  const seats = useMemo(() => layout(nodes), [nodes]);
  const byId = useMemo(() => new Map(seats.map((seat) => [seat.id, seat])), [seats]);
  const first = seats.find((seat) => seat.depth === 0) ?? seats[0];
  const [selectedId, setSelectedId] = useState(initialId && byId.has(initialId) ? initialId : first?.id ?? "");
  const [creating, setCreating] = useState(false);
  const [sealOpen, setSealOpen] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({ w: 960, h: 560 });
  const selected = byId.get(selectedId) ?? first;

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      setFrame({ w: element.clientWidth, h: element.clientHeight });
    });
    observer.observe(element);
    setFrame({ w: element.clientWidth, h: element.clientHeight });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!selected || document.querySelector("[data-dialogue]")) return;
      if (sealOpen) {
        if (event.key === "Escape") {
          event.preventDefault();
          setSealOpen(false);
        }
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) return;
      const siblings = orderedChildren(nodes, selected.parentId);
      const index = siblings.findIndex((node) => node.id === selected.id);
      const children = orderedChildren(nodes, selected.id);
      let next: string | null = null;
      if (event.key === "ArrowLeft" && index > 0) next = siblings[index - 1]?.id ?? null;
      if (event.key === "ArrowRight" && index >= 0 && index < siblings.length - 1) next = siblings[index + 1]?.id ?? null;
      if (event.key === "ArrowUp" && selected.parentId) next = selected.parentId;
      if (event.key === "ArrowDown" && children[0]) next = children[0].id;
      if (!next) return;
      event.preventDefault();
      setCreating(false);
      setSelectedId(next);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nodes, sealOpen, selected]);

  const neighborhood = useMemo(() => {
    if (!selected) return seats;
    if (selected.depth === 0) return seats;
    const siblings = orderedChildren(nodes, selected.parentId)
      .map((node) => byId.get(node.id))
      .filter((seat): seat is Seat => Boolean(seat));
    const children = orderedChildren(nodes, selected.id)
      .map((node) => byId.get(node.id))
      .filter((seat): seat is Seat => Boolean(seat));
    const parent = selected.parentId ? byId.get(selected.parentId) : undefined;
    return [parent, ...siblings, ...children].filter((seat): seat is Seat => Boolean(seat));
  }, [byId, nodes, seats, selected]);
  const bounds = neighborhood.reduce(
    (box, seat) => ({
      minX: Math.min(box.minX, seat.x - seat.w / 2),
      maxX: Math.max(box.maxX, seat.x + seat.w / 2),
      minY: Math.min(box.minY, seat.y - seat.h / 2),
      maxY: Math.max(box.maxY, seat.y + seat.h / 2),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
  const spanX = Math.max(bounds.maxX - bounds.minX, 1);
  const spanY = Math.max(bounds.maxY - bounds.minY, 1);
  const scale = Math.min((frame.w - 64) / spanX, (frame.h - 88) / spanY, 1.15);
  const focusX = (bounds.minX + bounds.maxX) / 2;
  const focusY = (bounds.minY + bounds.maxY) / 2;

  if (!selected) {
    return <p className="font-serif text-2xl text-sap">Aucune racine. Le Gaelor n’a pas encore dressé l’arbre.</p>;
  }

  const trail: Seat[] = [];
  let cursor: Seat | undefined = selected;
  while (cursor) {
    trail.unshift(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }

  return (
    <div>
      <div ref={stage} className="relative h-[68vh] min-h-[32rem] overflow-hidden">
        <div
          className="absolute left-0 top-0 transition-transform duration-500 ease-out"
          style={{ transform: `translate(${frame.w / 2}px, ${frame.h / 2}px) scale(${scale}) translate(${-focusX}px, ${-focusY}px)` }}
        >
          <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width="2400" height="1400">
            {seats.map((seat) => {
              if (!seat.parentId) return null;
              const parent = byId.get(seat.parentId);
              if (!parent) return null;
              const y1 = parent.y + parent.h / 2;
              const y2 = seat.y - seat.h / 2;
              const mid = (y1 + y2) / 2;
              return (
                <path
                  key={`${parent.id}-${seat.id}`}
                  d={`M ${parent.x} ${y1} C ${parent.x} ${mid}, ${seat.x} ${mid}, ${seat.x} ${y2}`}
                  fill="none"
                  stroke="rgba(198,161,91,0.55)"
                  strokeWidth={seat.id === selected.id || parent.id === selected.id ? 2.4 : 1.4}
                />
              );
            })}
          </svg>
          {seats.map((seat) => {
            const active = seat.id === selected.id;
            return (
              <button
                key={seat.id}
                type="button"
                onClick={() => {
                  setCreating(false);
                  setSelectedId(seat.id);
                }}
                className={`vellum absolute px-3 py-3 text-center transition duration-300 ${active ? "vellum-marked" : ""} ${seat.citizenName ? "" : "vellum-empty"}`}
                style={{
                  left: seat.x,
                  top: seat.y,
                  width: seat.w,
                  height: seat.h,
                  transform: `translate(-50%, -50%) scale(${active ? 1.04 : 1})`,
                  zIndex: active ? 2 : 1,
                  backgroundPosition: `${(seat.x / 12) % 100}% ${(seat.y / 9) % 100}%`,
                }}
              >
                <span className={`block font-display leading-tight text-ink ${seat.depth === 0 ? "text-2xl" : "line-clamp-2 text-base"}`}>{seat.title}</span>
                <span className={`mt-1 block truncate text-xs ${seat.citizenName ? "text-ink-soft" : "text-gold-deep"}`}>
                  {seat.citizenName ?? "Place vacante"}
                </span>
                {seat.superiorName ? (
                  <span className="mt-0.5 block truncate text-[10px] uppercase tracking-[0.12em] text-gold-deep/80">
                    Sous {seat.superiorName}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] uppercase tracking-[0.16em] text-sap/80">
          ← → le même rang · ↑ monter · ↓ descendre
        </p>
        {writable ? (
          <button type="button" className="wax-seal absolute bottom-8 right-6 z-10 transition" aria-label="Ouvrir le sceau" onClick={() => { setCreating(false); setSealOpen(true); }}>
            <Mark className="h-8 w-8" />
          </button>
        ) : null}
      </div>

      <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center gap-2 text-sm text-sap">
        {trail.map((seat, index) => (
          <span key={seat.id} className="flex items-center gap-2">
            {index > 0 ? <span className="text-gold/70">↓</span> : null}
            <button type="button" className="text-parchment hover:text-gold" onClick={() => setSelectedId(seat.id)}>
              {seat.title}
            </button>
          </span>
        ))}
      </div>

      {sealOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 py-8" onClick={() => setSealOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={creating ? "Nouvel office" : selected.title}
            className="form-sheet max-h-[88vh] w-full max-w-xl overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-gold-deep">Rang {selected.depth + 1}</p>
                <h2 className="mt-1 font-display text-4xl text-ink">{creating ? "Nouvelle place" : selected.title}</h2>
                <p className="mt-1 font-serif text-ink-soft">
                  {creating
                    ? `Sous ${selected.title}.`
                    : selected.citizenName
                      ? selected.superiorName
                        ? `${selected.citizenName} · sous ${selected.superiorName}`
                        : selected.citizenName
                      : "Place vacante."}
                </p>
              </div>
              <button type="button" className="wax-seal h-12 w-12 shrink-0" aria-label="Replier le parchemin" onClick={() => setSealOpen(false)}>
                <Mark className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-5 flex flex-wrap gap-4 font-serif text-lg">
              <button type="button" className={creating ? "text-ink-soft underline decoration-transparent" : "text-ink underline decoration-gold-deep"} onClick={() => setCreating(false)}>
                Corriger cette place
              </button>
              <button type="button" className={creating ? "text-ink underline decoration-gold-deep" : "text-ink-soft underline decoration-transparent"} onClick={() => setCreating(true)}>
                Asseoir un office en dessous
              </button>
            </div>
            <OfficeForm
              key={creating ? `nouveau-${selected.id}` : selected.id}
              node={creating ? null : selected}
              parentId={creating ? selected.id : selected.parentId}
              nodes={nodes}
              citizens={citizens}
              sortOrder={creating ? nextOrder(nodes, selected.id) : selected.sortOrder}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function nextOrder(nodes: OrgNode[], parentId: string) {
  const kids = orderedChildren(nodes, parentId);
  return kids.length ? kids[kids.length - 1].sortOrder + 10 : 10;
}

function OfficeForm({
  node,
  parentId,
  nodes,
  citizens,
  sortOrder,
}: {
  node: OrgNode | null;
  parentId: string | null;
  nodes: OrgNode[];
  citizens: { id: string; name: string; superiorId: string | null }[];
  sortOrder: number;
}) {
  const parentOffice = parentId ? nodes.find((item) => item.id === parentId) : null;
  return (
    <ActionForm action={saveOffice}>
      <input type="hidden" name="id" value={node?.id ?? ""} />
      <Field label="Titre">
        <input name="title" required defaultValue={node?.title ?? ""} className="vellum-ink" />
      </Field>
      <Field label="Rôle">
        <textarea name="summary" rows={3} defaultValue={node?.summary ?? ""} className="vellum-ink" />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Rattaché à">
          <select name="parentId" defaultValue={parentId ?? ""} className="vellum-ink">
            <option value="">Racine</option>
            {nodes
              .filter((item) => item.id !== node?.id)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                  {item.citizenName ? ` · ${item.citizenName}` : ""}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Membre">
          <select name="citizenId" defaultValue={node?.citizenId ?? ""} className="vellum-ink">
            <option value="">Place vacante</option>
            {citizens.map((citizen) => (
              <option key={citizen.id} value={citizen.id}>
                {citizen.name}
                {citizen.superiorId
                  ? ` · sous ${citizens.find((item) => item.id === citizen.superiorId)?.name ?? "…"}`
                  : ""}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {parentOffice?.citizenName ? (
        <p className="mb-3 text-sm text-ink-soft">
          En enregistrant, le titulaire prendra {parentOffice.citizenName} pour supérieur — sauf s’il est Gaelor.
        </p>
      ) : null}
      <Field label="Ordre sur le rang">
        <input name="sortOrder" type="number" defaultValue={sortOrder} className="vellum-ink" />
      </Field>
      <Button type="submit" className="!rounded-sm !bg-[#3a2418] font-serif tracking-wide">
        {node ? "Enregistrer la place" : "Dresser l’office"}
      </Button>
      {node ? (
        <div className="mt-2">
          <ActionForm action={deleteOffice}>
            <input type="hidden" name="id" value={node.id} />
            <Button type="submit" variant="danger">
              Retirer cet office
            </Button>
          </ActionForm>
        </div>
      ) : null}
    </ActionForm>
  );
}
