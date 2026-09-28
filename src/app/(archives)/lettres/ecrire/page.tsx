import { redirect } from "next/navigation";
import { LetterEditor } from "@/components/letter-editor";
import { PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { canVoice } from "@/lib/permissions";

export const metadata = { title: "Rédiger une lettre" };

export default async function ComposePage() {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) redirect("/parvis");

  return (
    <div>
      <PageHeader
        kicker="La Voix"
        title="Nouvelle lettre"
        lede="Elle reste dans les archives tant qu'elle n'est pas publiée. Une fois posée sur le Parvis, Gaéliens et visiteurs peuvent la lire."
      />
      <Panel>
        <LetterEditor initial={{ subject: "", body: "", status: "draft" }} />
      </Panel>
    </div>
  );
}
