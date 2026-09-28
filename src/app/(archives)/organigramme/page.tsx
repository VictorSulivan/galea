import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { OrgPyramid, type OrgNode } from "@/components/org-pyramid";
import { PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { citizens, offices } from "@/lib/db/schema";
import { can } from "@/lib/permissions";

export const metadata = { title: "Organigramme" };

export default async function OrgPage({ searchParams }: { searchParams: Promise<{ bureau?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !can(user, "zone.organigramme")) redirect("/hall");
  const { bureau = "" } = await searchParams;
  const writable = can(user, "organigramme.ecrire");
  const db = getDb();
  const [officeRows, citizenRows] = await Promise.all([
    db.select().from(offices).orderBy(asc(offices.sortOrder)),
    db.select().from(citizens).orderBy(asc(citizens.name)),
  ]);
  const names = new Map(citizenRows.map((citizen) => [citizen.id, citizen.name]));
  const nodes: OrgNode[] = officeRows.map((office) => ({
    id: office.id,
    parentId: office.parentId,
    title: office.title,
    summary: office.summary,
    sortOrder: office.sortOrder,
    citizenId: office.citizenId,
    citizenName: office.citizenId ? names.get(office.citizenId) ?? null : null,
  }));

  return (
    <div>
      <PageHeader
        kicker="La nation"
        title="Organigramme"
        lede="La pyramide de la nation. Monte, descends, et choisis une place."
      />
      <OrgPyramid
        nodes={nodes}
        citizens={citizenRows.map((citizen) => ({ id: citizen.id, name: citizen.name }))}
        writable={writable}
        initialId={bureau}
      />
    </div>
  );
}
