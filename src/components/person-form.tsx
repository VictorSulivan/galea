import { savePerson } from "@/server/directory";
import { ActionForm } from "./action-form";
import { FileField } from "./file-field";
import { Button, Field, inputClass } from "./ui";

export function PersonForm({
  person,
  categories,
}: {
  person?: {
    id: string;
    name: string;
    categoryId: string;
    office: string;
    summary: string;
    notes: string;
    portraitKey: string | null;
    featured: boolean;
  };
  categories: { id: string; name: string }[];
}) {
  return (
    <ActionForm action={savePerson}>
      <input type="hidden" name="id" value={person?.id ?? ""} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nom">
          <input name="name" required defaultValue={person?.name} className={inputClass} />
        </Field>
        <Field label="Catégorie">
          <select name="categoryId" required defaultValue={person?.categoryId ?? ""} className={inputClass}>
            <option value="">Choisir</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Fonction">
        <input name="office" required defaultValue={person?.office} className={inputClass} />
      </Field>
      <Field label="En bref">
        <textarea name="summary" rows={3} defaultValue={person?.summary} className={inputClass} />
      </Field>
      <Field label="Notes">
        <textarea name="notes" rows={8} defaultValue={person?.notes} className={inputClass} />
      </Field>
      <FileField name="portraitKey" label="Portrait" usage="portrait" current={person?.portraitKey} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="featured" defaultChecked={person?.featured} />
        Mettre en avant dans l’annuaire
      </label>
      <Button type="submit">Enregistrer la fiche</Button>
    </ActionForm>
  );
}
