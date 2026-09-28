"use client";

import { useState, type ChangeEvent } from "react";
import { labelClass } from "./ui";

export function FileField({
  name,
  label,
  usage,
  shelfId,
  current,
  onUploaded,
}: {
  name?: string;
  label: string;
  usage: "portrait" | "livre" | "piece";
  shelfId?: string;
  current?: string | null;
  onUploaded?: (src: string, key: string) => void;
}) {
  const [key, setKey] = useState(current ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const src = key ? `/api/media/${key.split("/").map(encodeURIComponent).join("/")}` : "";

  async function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const body = new FormData();
    body.set("file", file);
    body.set("usage", usage);
    if (shelfId) body.set("shelfId", shelfId);
    setBusy(true);
    setError("");
    const response = await fetch("/api/fichiers", { method: "POST", body });
    const data = (await response.json()) as { key?: string; src?: string; error?: string };
    setBusy(false);
    if (!response.ok || !data.key || !data.src) {
      setError(data.error ?? "L'image n'a pas pu être déposée.");
      return;
    }
    setKey(data.key);
    onUploaded?.(data.src, data.key);
  }

  return (
    <div>
      {name ? <input type="hidden" name={name} value={key} /> : null}
      <span className={labelClass}>{label}</span>
      {src ? <img src={src} alt="" className="mb-3 h-28 w-28 rounded-2xl object-cover" /> : null}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={onChange}
        disabled={busy}
        className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-moss file:px-3 file:py-1.5 file:text-parchment"
      />
      {busy ? <p className="mt-2 text-sm text-ink-soft">Dépôt dans le cellier…</p> : null}
      {error ? <p className="mt-2 text-sm text-clay">{error}</p> : null}
    </div>
  );
}
