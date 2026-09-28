import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LibraryStage } from "@/components/library-stage";
import { getCurrentUser } from "@/lib/auth";
import { loadLibraryStage } from "@/lib/books";
import { can } from "@/lib/permissions";

export default async function LibraryLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || !can(user, "zone.bibliotheque")) redirect("/hall");
  const shelves = await loadLibraryStage(user);
  return (
    <Suspense fallback={null}>
      <LibraryStage shelves={shelves}>{children}</LibraryStage>
    </Suspense>
  );
}
