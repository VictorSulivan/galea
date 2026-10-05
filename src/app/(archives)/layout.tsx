import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { getCurrentUser, isWhitelisted } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ArchivesLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.DATABASE_URL || !process.env.AUTH_SECRET) {
    redirect("/connexion");
  }
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (!isWhitelisted(user)) redirect("/attente");
  return <Shell user={user}>{children}</Shell>;
}
