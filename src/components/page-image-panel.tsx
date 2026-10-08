"use client";

import { formatBookImage, listBookImages, nextImageSlot, removeBookImage } from "@/lib/book-image";
import { PAGE_BODY_LINES_MAX, PAGE_BODY_MAX, clampPageBody } from "@/lib/book-page";
import { FileField } from "./file-field";
import { Button } from "./ui";

export function PageImagePanel({
  shelfId,
  body,
  onChange,
  onNotice,
}: {
  shelfId: string;
  body: string;
  onChange: (next: string) => void;
  onNotice: (message: string) => void;
}) {
  const images = listBookImages(body);

  function apply(next: string) {
    if (clampPageBody(next) !== next) {
      onNotice(`Plus de place sur ce feuillet (${PAGE_BODY_MAX} caractères / ${PAGE_BODY_LINES_MAX} lignes).`);
      return;
    }
    onNotice("");
    onChange(next);
  }

  function insertImage(src: string) {
    const slot = nextImageSlot(body);
    const snippet = formatBookImage({ alt: "illustration", src, ...slot, free: true });
    const next = body.trim() ? `${body.replace(/\s+$/, "")}\n\n${snippet}\n` : `${snippet}\n`;
    apply(next);
  }

  return (
    <div className="mt-4 rounded-xl border border-[#eadcc0] bg-white/35 p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-gold-deep">Images de la page</p>
      <p className="mt-1 text-xs text-ink-soft">
        Dépose une image sur le feuillet (ou ici). Ensuite, déplace-la et redimensionne-la directement sur la page.
      </p>

      <div className="mt-3">
        <FileField label="Ajouter une image" usage="livre" shelfId={shelfId} compact onUploaded={(src) => insertImage(src)} />
      </div>

      {images.length ? (
        <ul className="mt-4 grid gap-2">
          {images.map((image) => (
            <li key={`${image.start}-${image.src}`} className="flex items-center gap-3 rounded-lg border border-[#eadcc0] bg-white/50 px-3 py-2">
              <img src={image.src} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
              <div className="min-w-0 flex-1 text-xs text-ink-soft">
                {Math.round(image.layout.w)}% · x {Math.round(image.layout.x)}% · y {Math.round(image.layout.y)}%
              </div>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  onChange(removeBookImage(body, image.index));
                  onNotice("");
                }}
              >
                Retirer
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-ink-soft">Aucune image sur ce feuillet pour l’instant.</p>
      )}
    </div>
  );
}
