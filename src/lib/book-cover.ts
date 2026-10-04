export const DEFAULT_BOOK_COVER = "/gaelia/livre.jpg";

export function bookCoverSrc(coverKey: string | null | undefined) {
  if (!coverKey) return DEFAULT_BOOK_COVER;
  return `/api/media/${coverKey.split("/").map(encodeURIComponent).join("/")}`;
}
