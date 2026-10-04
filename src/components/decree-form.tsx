import { saveDecree } from "@/server/nation";
import { ActionForm } from "./action-form";
import { MarkdownField } from "./markdown-field";
import { Button, Field, inputClass } from "./ui";

export function DecreeFields({
  canPublish,
  decree,
  roles,
}: {
  canPublish: boolean;
  decree?: { id: string; title: string; preamble: string; body: string; status: string; issuerRole: string };
  roles: string[];
}) {
  return (
    <ActionForm action={saveDecree}>
      <input type="hidden" name="id" value={decree?.id ?? ""} />
      <Field label="Titre">
        <input name="title" required defaultValue={decree?.title} className={inputClass} />
      </Field>
      <Field label="Rôle qui promulgue">
        <select name="issuerRole" defaultValue={decree?.issuerRole ?? ""} className={inputClass}>
          <option value="">À préciser avant promulgation</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Préambule">
        <textarea name="preamble" rows={3} defaultValue={decree?.preamble} className={inputClass} />
      </Field>
      <MarkdownField name="body" label="Texte" defaultValue={decree?.body} usage="piece" rows={14} />
      <Field label="État">
        <select name="status" defaultValue={decree?.status ?? "draft"} className={inputClass}>
          <option value="draft">Brouillon</option>
          {canPublish ? <option value="published">Promulguer</option> : null}
          {canPublish ? <option value="repealed">Abroger</option> : null}
        </select>
      </Field>
      <Button type="submit">Enregistrer le décret</Button>
    </ActionForm>
  );
}
