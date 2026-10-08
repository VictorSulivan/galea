export const BOOK_IMAGE_SIZES = [
  { id: "sm", label: "Petite", width: 32, lines: 6 },
  { id: "md", label: "Moyenne", width: 52, lines: 10 },
  { id: "lg", label: "Grande", width: 72, lines: 15 },
  { id: "full", label: "Pleine largeur", width: 100, lines: 20 },
] as const;

export const BOOK_IMAGE_PLACES = [
  { id: "left", label: "Gauche" },
  { id: "center", label: "Centre" },
  { id: "right", label: "Droite" },
  { id: "float-left", label: "Flottante à gauche" },
  { id: "float-right", label: "Flottante à droite" },
] as const;

export type BookImageSize = (typeof BOOK_IMAGE_SIZES)[number]["id"];
export type BookImagePlace = (typeof BOOK_IMAGE_PLACES)[number]["id"];

export type BookImageLayout = {
  /** Largeur en % de la page (10–100). */
  w: number;
  /** Position gauche en % (0–100), mode libre. */
  x: number;
  /** Position haut en % (0–100), mode libre. */
  y: number;
  /** Ancien mode flux, si pas encore placé librement. */
  place: BookImagePlace;
  free: boolean;
};

export type BookImage = {
  raw: string;
  alt: string;
  src: string;
  layout: BookImageLayout;
  index: number;
  start: number;
  end: number;
};

function imagePattern() {
  return /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundPct(value: number) {
  return Math.round(value * 10) / 10;
}

function isSize(value: string): value is BookImageSize {
  return BOOK_IMAGE_SIZES.some((item) => item.id === value);
}

function isPlace(value: string): value is BookImagePlace {
  return BOOK_IMAGE_PLACES.some((item) => item.id === value);
}

function widthForSize(size: BookImageSize) {
  return BOOK_IMAGE_SIZES.find((item) => item.id === size)?.width ?? 52;
}

function defaultX(place: BookImagePlace, w: number) {
  if (place === "left" || place === "float-left") return 0;
  if (place === "right" || place === "float-right") return clamp(100 - w, 0, 100);
  return clamp((100 - w) / 2, 0, 100);
}

export function parseImageMeta(title = ""): BookImageLayout {
  let size: BookImageSize = "md";
  let place: BookImagePlace = "center";
  let w: number | null = null;
  let x: number | null = null;
  let y: number | null = null;

  for (const part of title.split(/[;\s]+/)) {
    const [key, value] = part.split(":");
    if (!key || value === undefined || value === "") continue;
    if ((key === "s" || key === "size") && isSize(value)) size = value;
    if ((key === "p" || key === "place") && isPlace(value)) place = value;
    if (key === "w" && Number.isFinite(Number(value))) w = clamp(Number(value), 10, 100);
    if (key === "x" && Number.isFinite(Number(value))) x = clamp(Number(value), 0, 100);
    if (key === "y" && Number.isFinite(Number(value))) y = clamp(Number(value), 0, 100);
  }

  const width = w ?? widthForSize(size);
  const free = x !== null && y !== null;
  return {
    w: width,
    x: x ?? defaultX(place, width),
    y: y ?? 8,
    place,
    free,
  };
}

export function formatBookImage({
  alt = "illustration",
  src,
  w = 52,
  x = 24,
  y = 8,
  place = "center",
  free = true,
}: {
  alt?: string;
  src: string;
  w?: number;
  x?: number;
  y?: number;
  place?: BookImagePlace;
  free?: boolean;
}) {
  const safeAlt = alt.replace(/[\[\]]/g, "").trim() || "illustration";
  const width = roundPct(clamp(w, 10, 100));
  if (free) {
    const left = roundPct(clamp(x, 0, 100 - width));
    const top = roundPct(clamp(y, 0, 100));
    return `![${safeAlt}](${src} "w:${width};x:${left};y:${top}")`;
  }
  const nearest = BOOK_IMAGE_SIZES.reduce((best, item) =>
    Math.abs(item.width - width) < Math.abs(best.width - width) ? item : best,
  );
  return `![${safeAlt}](${src} "s:${nearest.id};p:${place}")`;
}

export function listBookImages(body: string): BookImage[] {
  const images: BookImage[] = [];
  for (const match of body.matchAll(imagePattern())) {
    const raw = match[0];
    const start = match.index ?? 0;
    images.push({
      raw,
      alt: match[1] ?? "illustration",
      src: match[2] ?? "",
      layout: parseImageMeta(match[3] ?? ""),
      index: images.length,
      start,
      end: start + raw.length,
    });
  }
  return images;
}

export function imageLineCost(layout: BookImageLayout) {
  return Math.max(4, Math.round((layout.w / 100) * 22));
}

export function bodyImageLineCost(body: string) {
  return listBookImages(body).reduce((sum, image) => sum + imageLineCost(image.layout), 0);
}

export function updateBookImage(
  body: string,
  imageIndex: number,
  patch: Partial<{ alt: string; w: number; x: number; y: number; place: BookImagePlace; free: boolean }>,
) {
  const images = listBookImages(body);
  const image = images[imageIndex];
  if (!image) return body;
  const next = formatBookImage({
    alt: patch.alt ?? image.alt,
    src: image.src,
    w: patch.w ?? image.layout.w,
    x: patch.x ?? image.layout.x,
    y: patch.y ?? image.layout.y,
    place: patch.place ?? image.layout.place,
    free: patch.free ?? true,
  });
  return `${body.slice(0, image.start)}${next}${body.slice(image.end)}`;
}

export function removeBookImage(body: string, imageIndex: number) {
  const images = listBookImages(body);
  const image = images[imageIndex];
  if (!image) return body;
  let start = image.start;
  let end = image.end;
  while (start > 0 && body[start - 1] === "\n") start -= 1;
  while (end < body.length && body[end] === "\n") end += 1;
  if (start > 0 && end < body.length) {
    return `${body.slice(0, start)}\n\n${body.slice(end)}`.replace(/\n{3,}/g, "\n\n");
  }
  return `${body.slice(0, start)}${body.slice(end)}`.replace(/^\n+|\n+$/g, (value) => (value.length > 1 ? "\n" : value));
}

export function stripBookImages(body: string) {
  return body.replace(imagePattern(), "").replace(/\n{3,}/g, "\n\n").trim();
}

export function nextImageSlot(body: string) {
  const count = listBookImages(body).length;
  return {
    w: 48,
    x: 26,
    y: clamp(8 + count * 18, 4, 70),
  };
}
