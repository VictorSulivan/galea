import { bodyImageLineCost, stripBookImages } from "@/lib/book-image";

export const PAGE_TITLE_MAX = 96;
/** Capacité d’un feuillet A4 (texte courant + retours). */
export const PAGE_BODY_MAX = 2500;
export const PAGE_BODY_LINES_MAX = 36;
/** Largeur approximative d’une ligne du feuillet A4 (caractères). */
export const PAGE_LINE_WIDTH = 56;

export function pageLineCount(body: string) {
  if (!body) return 0;
  return body.split("\n").length;
}

/** Lignes visibles : retours, wrapping, et place prise par les images. */
export function pageVisualLineCount(body: string) {
  if (!body) return 0;
  const text = stripBookImages(body);
  let total = 0;
  if (text) {
    for (const line of text.split("\n")) {
      // Ligne vide = un vrai saut visible ; sinon wrapping approximatif.
      total += line.length === 0 ? 1 : Math.max(1, Math.ceil(line.length / PAGE_LINE_WIDTH));
    }
  } else if (body.includes("\n") || body.length > 0) {
    // Corps uniquement composé d’images / espaces : compter les retours restants.
    total += Math.max(0, body.split("\n").length - 1);
  }
  return total + bodyImageLineCost(body);
}

export function clampPageBody(incoming: string) {
  let next = incoming.slice(0, PAGE_BODY_MAX);

  const hardLines = next.split("\n");
  if (hardLines.length > PAGE_BODY_LINES_MAX) {
    next = hardLines.slice(0, PAGE_BODY_LINES_MAX).join("\n");
  }

  while (next.length > 0 && pageVisualLineCount(next) > PAGE_BODY_LINES_MAX) {
    next = next.slice(0, -1);
  }

  return next;
}

export function pageOverflowMessage(chapters: { title: string; body: string }[]) {
  for (let index = 0; index < chapters.length; index += 1) {
    const chapter = chapters[index];
    if (chapter.title.length > PAGE_TITLE_MAX) {
      return `Le titre de la page ${index + 1} dépasse ${PAGE_TITLE_MAX} signes.`;
    }
    if (chapter.body.length > PAGE_BODY_MAX) {
      return `La page ${index + 1} dépasse ${PAGE_BODY_MAX} caractères.`;
    }
    if (pageLineCount(chapter.body) > PAGE_BODY_LINES_MAX || pageVisualLineCount(chapter.body) > PAGE_BODY_LINES_MAX) {
      return `La page ${index + 1} dépasse ${PAGE_BODY_LINES_MAX} lignes (texte et images).`;
    }
  }
  return null;
}
