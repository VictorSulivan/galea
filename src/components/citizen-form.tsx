import { saveCitizen } from "@/server/nation";
import { ActionForm } from "./action-form";
import { FileField } from "./file-field";
import { Button, Field, inputClass } from "./ui";

export function CitizenForm({
  citizen,
  accounts,
}: {
  citizen?: {
    id: string;
    name: string;
    epithet: string;
    grade: string;
    status: string;
    joinedOn: string | null;
    notes: string;
    portraitKey: string | null;
    userId: string | null;
  };
  accounts: { id: string; displayName: string; email: string }[];
}) {
  return (
    <ActionForm action={saveCitizen}>
      <input type="hidden" name="id" value={citizen?.id ?? ""} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nom">
          <input name="name" required defaultValue={citizen?.name} className={inputClass} />
        </Field>
        <Field label="Surnom">
          <input name="epithet" defaultValue={citizen?.epithet} className={inputClass} />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Grade">
          <input name="grade" defaultValue={citizen?.grade} placeholder="Gaelor, conseil, sentinelle…" className={inputClass} />
        </Field>
        <Field label="État">
          <select name="status" defaultValue={citizen?.status ?? "actif"} className={inputClass}>
            <option value="actif">Actif</option>
            <option value="en_mission">En mission</option>
            <option value="absent">Absent</option>
            <option value="exile">Exilé</option>
            <option value="tombe">Tombé</option>
          </select>
        </Field>
        <Field label="Arrivée">
          <input type="date" name="joinedOn" defaultValue={citizen?.joinedOn ?? ""} className={inputClass} />
        </Field>
      </div>
      <Field label="Compte lié">
        <select name="userId" defaultValue={citizen?.userId ?? ""} className={inputClass}>
          <option value="">Aucun sceau</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.displayName} · {account.email}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Notes">
        <textarea name="notes" rows={6} defaultValue={citizen?.notes} className={inputClass} />
      </Field>
      <FileField name="portraitKey" label="Portrait" usage="portrait" current={citizen?.portraitKey} />
      <Button type="submit">Enregistrer</Button>
    </ActionForm>
  );
}
