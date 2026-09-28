import { Mark } from "@/components/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <Mark className="h-14 w-14 text-gold" />
      <h1 className="mt-4 font-display text-4xl">Ce feuillet n’existe pas</h1>
      <Link href="/hall" className="mt-6 text-gold">
        Revenir au Hall
      </Link>
    </main>
  );
}
