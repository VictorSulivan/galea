import { redirect } from "next/navigation";
import { DecreeFields } from "@/components/decree-form";
import { PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { canVoice } from "@/lib/permissions";

export const metadata = { title: "Nouveau décret" };

export default async function NewDecreePage() {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) redirect("/parvis");
  return (
    <div>
      <PageHeader kicker="Décrets" title="Nouveau décret" />
      <Panel>
        <DecreeFields canPublish />
      </Panel>
    </div>
  );
}
