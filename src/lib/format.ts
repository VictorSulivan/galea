export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}

export function formatDay(value: string | null | undefined) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(year, month - 1, day));
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function likeTerm(query: string) {
  return `%${query.trim().replace(/[%_]/g, "").slice(0, 80)}%`;
}

export const BOOK_STATUS: Record<string, string> = {
  draft: "Brouillon",
  published: "Publié",
  archived: "Archivé",
};

export const DECREE_STATUS: Record<string, string> = {
  draft: "Brouillon",
  published: "Promulgué",
  repealed: "Abrogé",
};

export const CITIZEN_STATUS: Record<string, string> = {
  actif: "Actif",
  en_mission: "En mission",
  absent: "Absent",
  exile: "Exilé",
  tombe: "Tombé",
};

export const SENSITIVITY: Record<string, string> = {
  ouvert: "Ouvert",
  restreint: "Restreint",
  secret: "Secret",
};

export function readText(formData: FormData, key: string, max = 4000) {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function readDay(formData: FormData, key: string) {
  const value = readText(formData, key, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}
