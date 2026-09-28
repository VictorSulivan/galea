"use client";

import { Mark } from "@/components/ui";

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <Mark className="h-14 w-14 text-gold" />
      <h1 className="mt-4 font-display text-4xl">Les archives se sont refermées</h1>
      <p className="mt-3 text-sap">La base Neon ne répond pas, ou la configuration est incomplète. Vérifie `.env.local`, puis réessaie.</p>
      <button onClick={reset} className="mt-6 rounded-full bg-gold px-4 py-2 text-sm text-moss-deep">
        Rouvrir
      </button>
    </main>
  );
}
