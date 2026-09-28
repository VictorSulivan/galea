"use client";

import { saveLetter } from "@/server/letters";
import { MarkdownField } from "./markdown-field";
import { ActionForm } from "./action-form";
import { Button, Field, inputClass } from "./ui";

export function LetterEditor({
  letterId,
  initial,
}: {
  letterId?: string;
  initial: { subject: string; body: string; status: string };
}) {
  return (
    <ActionForm action={saveLetter}>
      <input type="hidden" name="id" value={letterId ?? ""} />
      <Field label="Objet">
        <input name="subject" required defaultValue={initial.subject} className={inputClass} />
      </Field>
      <MarkdownField name="body" label="Lettre" defaultValue={initial.body} usage="piece" rows={14} />
      <Field label="État">
        <select name="status" defaultValue={initial.status || "draft"} className={inputClass}>
          <option value="draft">Brouillon, visible seulement ici</option>
          <option value="published">Publier sur le Parvis</option>
        </select>
      </Field>
      <Button type="submit">Enregistrer la lettre</Button>
    </ActionForm>
  );
}
