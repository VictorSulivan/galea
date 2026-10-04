import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { DecreeFields } from "@/components/decree-form";
import { PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { offices } from "@/lib/db/schema";
import { canVoice } from "@/lib/permissions";

export const metadata = { title: "Nouveau décret" };

async function issuerRoles(extra = "") {
  const rows = await getDb().select({ title: offices.title }).from(offices).orderBy(asc(offices.sortOrder), asc(offices.title));
  const roles = rows.map((row) => row.title);
  if (extra && !roles.includes(extra)) roles.unshift(extra);
  if (!roles.includes("Gaelor")) roles.unshift("Gaelor");
  return roles;
}

export default async function NewDecreePage() {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) redirect("/parvis");
  const roles = await issuerRoles();
  return (
    <div>
      <PageHeader kicker="Décrets" title="Nouveau décret" lede="Seul le Gaelor ou un membre du Conseil promulgue, sous le rôle qu’il porte." />
      <Panel sheet>
        <DecreeFields canPublish roles={roles} />
      </Panel>
    </div>
  );
}
