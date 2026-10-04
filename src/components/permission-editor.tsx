"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { ActionState } from "@/lib/action";
import {
  POWER_LEVELS,
  PRESETS,
  ZONES,
  describeGrant,
  presetGrants,
  sensitivityLabel,
  shelfEffectsAt,
  shelfKey,
  zoneEffectsAt,
  type GrantLevel,
  type PresetId,
  type ShelfRef,
} from "@/lib/permissions";
import { ActionForm } from "./action-form";
import { Badge, Button } from "./ui";

type EditorItem = {
  key: string;
  label: string;
  summary: string;
  sensitivity?: ShelfRef["sensitivity"];
  kind: "zone" | "shelf";
};

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
  const [activePreset, setActivePreset] = useState<PresetId | null>(null);
  const needle = query.trim().toLowerCase();

  function applyPreset(preset: PresetId) {
    setActivePreset(preset);
    setLevels(Object.fromEntries(presetGrants(preset, shelves).map((grant) => [grant.key, grant.level])));
  }

  const groups = useMemo(() => {
    const bySensitivity = [
      { title: "Rayons ouverts", sensitivity: "ouvert" as const },
      { title: "Rayons restreints", sensitivity: "restreint" as const },
      { title: "Rayons secrets", sensitivity: "secret" as const },
    ];
    return [
      {
        title: "Portes de la nation",
        lede: "Chaque section a un seuil. Le degré choisi ouvre tout ce qui est listé en dessous — pas seulement la case cochée.",
        items: ZONES.map(
          (zone): EditorItem => ({
            key: zone.key,
            label: zone.label,
            summary: zone.summary,
            kind: "zone",
          }),
        ),
      },
      ...bySensitivity
        .map((group) => ({
          title: group.title,
          lede:
            group.sensitivity === "ouvert"
              ? "Rayons créés dans la salle du sceau. Le degré fixe jusqu’à quel niveau d’écrit on peut lire."
              : group.sensitivity === "restreint"
                ? "Réservés au cercle que tu choisis. Même règle : le degré lit ce niveau et ceux en dessous."
                : "Les plus gardés. Un initié de degré 2 ne lit pas un secret de degré 5.",
          items: shelves
            .filter((shelf) => shelf.sensitivity === group.sensitivity)
            .map(
              (shelf): EditorItem => ({
                key: shelfKey(shelf.slug),
                label: shelf.name,
                summary: `Rayon administrable · ${sensitivityLabel(shelf.sensitivity)}`,
                sensitivity: shelf.sensitivity,
                kind: "shelf",
              }),
            ),
        }))
        .filter((group) => group.items.length > 0),
    ];
  }, [shelves]);

  const keys = groups.flatMap((group) => group.items.map((item) => item.key));
  const openCount = keys.filter((key) => (levels[key] ?? 0) > 0).length;

  return (
    <ActionForm action={action} className="grid gap-6">
      {children}
      {keys.map((key) => (
        <input key={key} type="hidden" name={key} value={levels[key] ?? 0} />
      ))}

      <section className="rounded-2xl border border-[#eadcc0] bg-[#fff8ea]/80 px-4 py-4 text-sm leading-6 text-ink-soft">
        <p className="font-display text-xl text-ink">Comment poser un sceau</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Choisis un modèle pour préremplir (tu peux tout changer après).</li>
          <li>Pour chaque porte, sélectionne le degré : 0 ferme, 1 à 5 ouvre de plus en plus.</li>
          <li>Lis la phrase sous le menu : elle dit exactement ce que ce degré autorise.</li>
        </ol>
        <p className="mt-3">
          Les listes (catégories, grades, offices, rayons) se gèrent dans chaque salle. Ici, tu décides seulement{" "}
          <strong className="font-medium text-ink">qui peut les voir ou les tenir</strong>.
        </p>
      </section>

      <section>
        <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-gold-deep">Modèles de départ</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PRESETS.map((preset) => {
            const on = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`rounded-2xl border px-3 py-3 text-left transition ${
                  on ? "border-gold bg-gold/15" : "border-[#eadcc0] bg-white/50 hover:border-gold/50"
                }`}
              >
                <span className="block font-display text-xl text-ink">{preset.label}</span>
                <span className="mt-1 block text-sm leading-5 text-ink-soft">{preset.about}</span>
              </button>
            );
          })}
        </div>
      </section>

      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActivePreset(null);
        }}
        placeholder="Chercher une porte ou un rayon"
        className="w-full rounded-full border border-[#e0cfaa] bg-white/70 px-4 py-2 text-sm text-ink outline-none"
      />
      <p className="text-sm text-ink-soft">
        {openCount} porte{openCount > 1 ? "s" : ""} ouverte{openCount > 1 ? "s" : ""}. Degré 2 lit 1 et 2, jamais 5.
      </p>

      {groups.map((group) => (
        <fieldset key={group.title} className="grid gap-3">
          <legend className="font-display text-2xl text-ink">{group.title}</legend>
          <p className="text-sm text-ink-soft">{group.lede}</p>
          <div className="grid gap-3">
            {group.items.map((item) => {
              const visible = !needle || `${item.label} ${item.summary}`.toLowerCase().includes(needle);
              const level = levels[item.key] ?? 0;
              const unlocked =
                item.kind === "zone"
                  ? zoneEffectsAt(ZONES.find((zone) => zone.key === item.key)?.effects ?? [], level)
                  : shelfEffectsAt(level, item.sensitivity ?? "ouvert");
              return (
                <div
                  key={item.key}
                  className={`rounded-2xl border border-[#eadcc0] bg-white/55 px-4 py-4 ${visible ? "" : "hidden"}`}
                >
                  <div className="grid gap-3 md:grid-cols-[1fr_13rem] md:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-xl text-ink">{item.label}</p>
                        {item.sensitivity && item.sensitivity !== "ouvert" ? (
                          <Badge tone={item.sensitivity === "secret" ? "clay" : "gold"}>
                            {sensitivityLabel(item.sensitivity)}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-ink-soft">{item.summary}</p>
                    </div>
                    <label className="block">
                      <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-gold-deep">Degré</span>
                      <select
                        value={level}
                        onChange={(event) => {
                          setActivePreset(null);
                          setLevels((current) => ({ ...current, [item.key]: Number(event.target.value) }));
                        }}
                        aria-label={`Degré de ${item.label}`}
                        className="w-full rounded-xl border border-[#e0cfaa] bg-white px-3 py-2 text-sm text-ink"
                      >
                        {POWER_LEVELS.map((power) => (
                          <option key={power.level} value={power.level}>
                            {power.label} — {power.brief}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="mt-3 rounded-xl border border-[#eadcc0]/80 bg-[#fffaf0] px-3 py-2 text-sm text-ink">
                    {level <= 0 ? (
                      <p className="text-ink-soft">Fermé pour cette personne.</p>
                    ) : unlocked.length === 0 ? (
                      <p className="text-ink-soft">{describeGrant(item.key, level, shelves)}</p>
                    ) : (
                      <ul className="list-disc space-y-1 pl-4">
                        {unlocked.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
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
