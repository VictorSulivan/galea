import { saveVoiceNote } from "@/server/nation";
import { ActionForm } from "./action-form";
import { MarkdownField } from "./markdown-field";
import { Button, Field, inputClass } from "./ui";

export function VoiceNoteForm({
  note,
  defaultKind = "reunion",
}: {
  note?: {
    id: string;
    kind: string;
    title: string;
    body: string;
    occurredOn: string | null;
  };
  defaultKind?: "reunion" | "evenement";
}) {
  return (
    <ActionForm action={saveVoiceNote}>
      <input type="hidden" name="id" value={note?.id ?? ""} />
      <div className="grid gap-4 md:grid-cols-[11rem_1fr]">
        <Field label="Type">
          <select name="kind" defaultValue={note?.kind ?? defaultKind} className={inputClass}>
            <option value="reunion">Réunion</option>
            <option value="evenement">Événement</option>
          </select>
        </Field>
        <Field label="Date">
          <input type="date" name="occurredOn" defaultValue={note?.occurredOn ?? ""} className={inputClass} />
        </Field>
      </div>
      <Field label="Titre">
        <input
          name="title"
          required
          defaultValue={note?.title}
          placeholder={note ? undefined : defaultKind === "evenement" ? "Sève lumineuse hors saison" : "Conseil du 12 septembre"}
          className={inputClass}
        />
      </Field>
      <MarkdownField
        name="body"
        label={note?.kind === "evenement" || defaultKind === "evenement" ? "Ce qu’il faut retenir" : "Compte rendu"}
        defaultValue={note?.body}
        usage="piece"
        rows={16}
      />
      <Button type="submit">{note ? "Enregistrer" : "Déposer dans le cahier"}</Button>
    </ActionForm>
  );
}
