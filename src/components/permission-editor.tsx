"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { ActionState } from "@/lib/action";
import {
  POWER_LEVELS,
  PRESETS,
  ZONES,
  levelLabel,
  presetGrants,
  shelfKey,
  type GrantLevel,
  type PresetId,
  type ShelfRef,
} from "@/lib/permissions";
import { ActionForm } from "./action-form";
import { Badge, Button } from "./ui";

export function PermissionEditor({
  action,
  shelves,
  initial,
  children,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  shelves: ShelfRef[];
  initial: GrantLevel[];
  children?: ReactNode;
  submitLabel: string;
}) {
  const [levels, setLevels] = useState<Record<string, number>>(() =>
    Object.fromEntries(initial.map((grant) => [grant.key, grant.level])),
  );
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  function applyPreset(preset: PresetId) {
    setLevels(Object.fromEntries(presetGrants(preset, shelves).map((grant) => [grant.key, grant.level])));
  }

  const groups = useMemo(
    () => [
      {
        title: "Sections",
        items: ZONES.map((zone) => ({ key: zone.key, label: zone.label, hint: zone.hint, sensitivity: "" })),
      },
      {
        title: "Rayons de la bibliothèque",
        items: shelves.map((shelf) => ({
          key: shelfKey(shelf.slug),
          label: shelf.name,
          hint: "Le degré ouvre ce niveau et tous ceux en dessous.",
          sensitivity: shelf.sensitivity,
        })),
      },
    ],
    [shelves],
  );

  const keys = groups.flatMap((group) => group.items.map((item) => item.key));
  const openCount = keys.filter((key) => (levels[key] ?? 0) > 0).length;

  return (
    <ActionForm action={action} className="grid gap-6">
      {children}
      {keys.map((key) => (
        <input key={key} type="hidden" name={key} value={levels[key] ?? 0} />
      ))}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset.id)}
            className="rounded-full border border-[#d9c7a3] px-3 py-1.5 text-sm text-ink hover:bg-white"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Chercher une section"
        className="w-full rounded-full border border-[#e0cfaa] bg-white/70 px-4 py-2 text-sm text-ink outline-none"
      />
      <p className="text-sm text-ink-soft">
        {openCount} section{openCount > 1 ? "s" : ""} ouverte{openCount > 1 ? "s" : ""}. Un niveau 2 lit les écrits 1 et 2, pas le 5.
      </p>
      {groups.map((group) => (
        <fieldset key={group.title} className="grid gap-2">
          <legend className="mb-2 font-display text-2xl">{group.title}</legend>
          <div className="grid gap-2">
            {group.items.map((item) => {
              const visible = !needle || `${item.label} ${item.hint}`.toLowerCase().includes(needle);
              const level = levels[item.key] ?? 0;
              return (
                <label
                  key={item.key}
                  className={`grid items-center gap-3 rounded-2xl border border-[#eadcc0] bg-white/45 px-3 py-3 md:grid-cols-[1fr_12rem] ${visible ? "" : "hidden"}`}
                >
                  <span>
                    <span className="block text-sm">{item.label}</span>
                    <span className="mt-1 flex items-center gap-2 text-xs text-ink-soft">
                      {item.hint}
                      {item.sensitivity === "secret" ? <Badge tone="clay">Secret</Badge> : null}
                      {item.sensitivity === "restreint" ? <Badge>Restreint</Badge> : null}
                    </span>
                  </span>
                  <select
                    value={level}
                    onChange={(event) => setLevels((current) => ({ ...current, [item.key]: Number(event.target.value) }))}
                    aria-label={`Degré de ${item.label}`}
                    className="rounded-xl border border-[#e0cfaa] bg-white px-3 py-2 text-sm text-ink"
                  >
                    {POWER_LEVELS.map((power) => (
                      <option key={power.level} value={power.level}>
                        {power.label}
                      </option>
                    ))}
                  </select>
                  <span className="sr-only">{levelLabel(level)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      <div>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </ActionForm>
  );
}
