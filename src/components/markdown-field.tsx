"use client";

import { useState } from "react";
import { FileField } from "./file-field";
import { inputClass, labelClass } from "./ui";

export function MarkdownField({
  name,
  label,
  defaultValue = "",
  usage,
  shelfId,
  rows = 12,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  usage: "livre" | "piece";
  shelfId?: string;
  rows?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <textarea name={name} value={value} rows={rows} onChange={(event) => setValue(event.target.value)} className={inputClass} />
      <p className="mt-2 text-xs text-ink-soft">Markdown : **gras**, *italique*, listes, tableaux. Une image se pose à la fin du texte.</p>
      <div className="mt-3">
        <FileField
          label="Image"
          usage={usage}
          shelfId={shelfId}
          onUploaded={(src) => setValue((current) => `${current}\n\n![illustration](${src})\n`)}
        />
      </div>
    </div>
  );
}
