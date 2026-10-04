export const PAGE_TITLE_MAX = 72;
export const PAGE_BODY_MAX = 500;
export const PAGE_BODY_LINES_MAX = 12;
/** Largeur approximative d’une ligne du feuillet (caractères). */
export const PAGE_LINE_WIDTH = 42;

export function pageLineCount(body: string) {
  if (!body) return 0;
  return body.split("\n").length;
}

/** Lignes visibles en tenant compte du retour automatique. */
export function pageVisualLineCount(body: string) {
  if (!body) return 0;
  let total = 0;
  for (const line of body.split("\n")) {
    total += Math.max(1, Math.ceil(line.length / PAGE_LINE_WIDTH));
  }
  return total;
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
      return `La page ${index + 1} dépasse ${PAGE_BODY_LINES_MAX} lignes.`;
    }
  }
  return null;
}
