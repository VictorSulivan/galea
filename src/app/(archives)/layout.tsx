import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ArchivesLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.DATABASE_URL || !process.env.AUTH_SECRET) {
    redirect("/connexion");
  }
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  return <Shell user={user}>{children}</Shell>;
}
