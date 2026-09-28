import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { DecreeFields } from "@/components/decree-form";
import { PageHeader, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { decrees } from "@/lib/db/schema";
import { canVoice } from "@/lib/permissions";

export const metadata = { title: "Reprendre un décret" };

export default async function EditDecreePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canVoice(user)) redirect("/parvis");
  const { id } = await params;
  const decree = await getDb().query.decrees.findFirst({ where: eq(decrees.id, id) });
  if (!decree) notFound();
  return (
    <div>
      <PageHeader kicker={decree.reference ?? "Brouillon"} title={decree.title} />
      <Panel>
        <DecreeFields canPublish decree={decree} />
      </Panel>
    </div>
  );
}
