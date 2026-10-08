"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  formatBookImage,
  listBookImages,
  nextImageSlot,
  removeBookImage,
  stripBookImages,
  updateBookImage,
  type BookImage,
  type BookImageLayout,
} from "@/lib/book-image";
import { PAGE_BODY_LINES_MAX, PAGE_BODY_MAX, clampPageBody } from "@/lib/book-page";
import { Markdown } from "./markdown";

type DragState =
  | { kind: "move"; index: number; startX: number; startY: number; origX: number; origY: number; width: number }
  | { kind: "resize"; index: number; startX: number; origW: number; origX: number };

function FigureFrame({
  image,
  layout,
  editable,
  selected,
  dragging,
  onSelect,
  onPointerDownMove,
  onPointerDownResize,
  onRemove,
}: {
  image: BookImage;
  layout: BookImageLayout;
  editable: boolean;
  selected: boolean;
  dragging: boolean;
  onSelect: () => void;
  onPointerDownMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerDownResize: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`book-fig-free ${editable ? "is-editable" : ""} ${selected ? "is-selected" : ""} ${dragging ? "is-dragging" : ""}`}
      style={{ width: `${layout.w}%`, left: `${layout.x}%`, top: `${layout.y}%` }}
      data-index={image.index}
      onPointerDown={editable ? onSelect : undefined}
    >
      <div
        className="book-fig-free-frame"
        onPointerDown={editable ? onPointerDownMove : undefined}
        style={editable ? { cursor: dragging ? "grabbing" : "grab" } : undefined}
      >
        <img src={image.src} alt={image.alt} draggable={false} />
        {image.alt && image.alt !== "illustration" ? <figcaption>{image.alt}</figcaption> : null}
      </div>
      {editable && selected ? (
        <>
          <button
            type="button"
            className="book-fig-free-remove"
            aria-label="Retirer l’image"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
          >
            ×
          </button>
          <div className="book-fig-free-handle" onPointerDown={onPointerDownResize} aria-label="Redimensionner" />
        </>
      ) : null}
    </div>
  );
}

export function BookPageSurface({
  kicker,
  title,
  body,
  editable = false,
  shelfId,
  onChange,
  onNotice,
}: {
  kicker: string;
  title: string;
  body: string;
  editable?: boolean;
  shelfId?: string;
  onChange?: (next: string) => void;
  onNotice?: (message: string) => void;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef(body);
  const dragRef = useRef<DragState | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [draft, setDraft] = useState<Record<number, BookImageLayout>>({});
  const [dropping, setDropping] = useState(false);
  const [busy, setBusy] = useState(false);
  const images = listBookImages(body);
  const text = stripBookImages(body);

  bodyRef.current = body;
  dragRef.current = drag;

  function apply(next: string) {
    if (!onChange) return;
    if (clampPageBody(next) !== next) {
      onNotice?.(`Plus de place sur ce feuillet (${PAGE_BODY_MAX} caractères / ${PAGE_BODY_LINES_MAX} lignes).`);
      return;
    }
    onNotice?.("");
    onChange(next);
  }

  async function uploadFile(file: File, at?: { x: number; y: number }) {
    if (!shelfId || !onChange) return;
    const form = new FormData();
    form.set("file", file);
    form.set("usage", "livre");
    form.set("shelfId", shelfId);
    setBusy(true);
    onNotice?.("");
    try {
      const response = await fetch("/api/fichiers", { method: "POST", body: form });
      const data = (await response.json()) as { key?: string; src?: string; error?: string };
      if (!response.ok || !data.src) {
        onNotice?.(data.error ?? "L'image n'a pas pu être déposée.");
        return;
      }
      const slot = nextImageSlot(bodyRef.current);
      const snippet = formatBookImage({
        alt: "illustration",
        src: data.src,
        w: slot.w,
        x: at ? Math.max(0, Math.min(100 - slot.w, at.x - slot.w / 2)) : slot.x,
        y: at ? Math.max(0, Math.min(90, at.y - 4)) : slot.y,
        free: true,
      });
      const current = bodyRef.current;
      const next = current.trim() ? `${current.replace(/\s+$/, "")}\n\n${snippet}\n` : `${snippet}\n`;
      apply(next);
      setSelected(listBookImages(next).length - 1);
    } finally {
      setBusy(false);
    }
  }

  function pointPercent(clientX: number, clientY: number) {
    const box = surfaceRef.current?.getBoundingClientRect();
    if (!box || box.width <= 0 || box.height <= 0) return { x: 0, y: 0 };
    return {
      x: ((clientX - box.left) / box.width) * 100,
      y: ((clientY - box.top) / box.height) * 100,
    };
  }

  useEffect(() => {
    if (!drag || !editable) return;

    function onMove(event: PointerEvent) {
      const current = dragRef.current;
      const box = surfaceRef.current?.getBoundingClientRect();
      if (!current || !box || box.width <= 0) return;
      if (current.kind === "move") {
        const dx = ((event.clientX - current.startX) / box.width) * 100;
        const dy = ((event.clientY - current.startY) / box.height) * 100;
        const nextX = Math.min(100 - current.width, Math.max(0, current.origX + dx));
        const nextY = Math.min(92, Math.max(0, current.origY + dy));
        setDraft((prev) => ({
          ...prev,
          [current.index]: {
            ...(prev[current.index] ?? listBookImages(bodyRef.current)[current.index]?.layout!),
            w: current.width,
            x: nextX,
            y: nextY,
            free: true,
            place: "center",
          },
        }));
      } else {
        const dx = ((event.clientX - current.startX) / box.width) * 100;
        const nextW = Math.min(100 - current.origX, Math.max(12, current.origW + dx));
        setDraft((prev) => {
          const base = prev[current.index] ?? listBookImages(bodyRef.current)[current.index]?.layout;
          if (!base) return prev;
          return {
            ...prev,
            [current.index]: { ...base, w: nextW, free: true },
          };
        });
      }
    }

    function onUp() {
      const current = dragRef.current;
      setDrag(null);
      if (!current) return;
      setDraft((prev) => {
        const layout = prev[current.index];
        if (layout && onChange) {
          const nextBody = updateBookImage(bodyRef.current, current.index, {
            w: layout.w,
            x: layout.x,
            y: layout.y,
            free: true,
          });
          queueMicrotask(() => {
            if (clampPageBody(nextBody) !== nextBody) {
              onNotice?.(`Plus de place sur ce feuillet (${PAGE_BODY_MAX} caractères / ${PAGE_BODY_LINES_MAX} lignes).`);
              return;
            }
            onNotice?.("");
            onChange(nextBody);
          });
        }
        const next = { ...prev };
        delete next[current.index];
        return next;
      });
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, editable]);

  return (
    <div
      className={`book-leaf ${editable ? "book-leaf-editor book-leaf-interactive" : ""} ${dropping ? "is-dropping" : ""}`}
      onDragEnter={
        editable
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
              setDropping(true);
            }
          : undefined
      }
      onDragOver={
        editable
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
              setDropping(true);
            }
          : undefined
      }
      onDragLeave={
        editable
          ? (event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node)) return;
              setDropping(false);
            }
          : undefined
      }
      onDrop={
        editable
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              setDropping(false);
              const file = event.dataTransfer.files?.[0];
              if (!file || !file.type.startsWith("image/")) {
                onNotice?.("Dépose une image (jpg, png, webp, gif).");
                return;
              }
              void uploadFile(file, pointPercent(event.clientX, event.clientY));
            }
          : undefined
      }
      onPointerDown={
        editable
          ? (event) => {
              if ((event.target as HTMLElement).closest(".book-fig-free")) return;
              setSelected(null);
            }
          : undefined
      }
    >
      <p className="reader-kicker">{kicker}</p>
      <h2 className="reader-chapter">{title || "Page"}</h2>
      <div className="book-leaf-body" ref={surfaceRef}>
        <div className="book-leaf-text">
          <Markdown
            source={
              text ||
              (editable
                ? "*Glisse une image ici, ou écris le texte de la page.*"
                : "*Cette page est encore blanche.*")
            }
          />
        </div>
        {images.map((image) => {
          const layout = draft[image.index] ?? image.layout;
          return (
            <FigureFrame
              key={`${image.src}-${image.index}`}
              image={image}
              layout={layout}
              editable={editable}
              selected={selected === image.index}
              dragging={drag?.index === image.index}
              onSelect={() => setSelected(image.index)}
              onRemove={() => {
                onChange?.(removeBookImage(body, image.index));
                setSelected(null);
                onNotice?.("");
              }}
              onPointerDownMove={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setSelected(image.index);
                setDraft((prev) => ({ ...prev, [image.index]: image.layout }));
                setDrag({
                  kind: "move",
                  index: image.index,
                  startX: event.clientX,
                  startY: event.clientY,
                  origX: image.layout.x,
                  origY: image.layout.y,
                  width: image.layout.w,
                });
              }}
              onPointerDownResize={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setSelected(image.index);
                setDraft((prev) => ({ ...prev, [image.index]: image.layout }));
                setDrag({
                  kind: "resize",
                  index: image.index,
                  startX: event.clientX,
                  origW: image.layout.w,
                  origX: image.layout.x,
                });
              }}
            />
          );
        })}
        {editable && dropping ? <div className="book-leaf-drop-hint">Déposer l’image sur le feuillet</div> : null}
        {editable && busy ? <div className="book-leaf-drop-hint">Dépôt dans le cellier…</div> : null}
      </div>
      {editable ? (
        <p className="book-leaf-hint">
          Glisse une image sur le feuillet · clique pour sélectionner · tire pour déplacer · coin pour redimensionner
        </p>
      ) : null}
    </div>
  );
}
