import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Button, Field, Mark, inputClass } from "@/components/ui";
import { discordConfigured } from "@/lib/discord";
import { login } from "@/server/session";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  discord: "Discord n’est pas configuré, ou la connexion a échoué.",
  etat: "La session Discord a expiré. Recommence.",
  refuse: "Ce compte Discord n’est pas admis — ou Discord a refusé.",
};

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur = "" } = await searchParams;
  const ready = Boolean(process.env.DATABASE_URL && process.env.AUTH_SECRET);
  const discordReady = ready && discordConfigured();
  const message = ERRORS[erreur] ?? "";

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex flex-col justify-between px-6 py-10 md:px-14">
        <div className="flex items-center gap-3 text-gold">
          <Mark />
          <p className="text-[11px] uppercase tracking-[0.24em]">Nation de la terre</p>
        </div>
        <div className="max-w-xl py-16">
          <p className="text-gold">Nation de la terre et de la nature</p>
          <h1 className="mt-3 font-display text-6xl leading-[0.95] tracking-tight md:text-7xl">La table de Gaélia est ouverte.</h1>
          <p className="mt-6 max-w-md text-lg text-sap">
            Les décrets se lisent sans connexion. Pour entrer dans l’espace privé, passe par Discord : le Gardien doit
            encore t’ouvrir le sceau.
          </p>
        </div>
        <p className="text-sm text-sap/70">Ce qui est écrit ici reste dans la nation.</p>
      </section>
      <section className="flex items-center px-6 py-10 md:px-12">
        <div className="form-sheet w-full">
          <h2 className="font-display text-4xl">Entrer</h2>
          <p className="mt-2 text-sm text-ink-soft">Discord crée ta demande. Sans whitelist, la table reste fermée.</p>
          {!ready ? (
            <p className="mt-4 rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay">
              Relie d’abord Neon : DATABASE_URL et AUTH_SECRET manquent dans .env.local.
            </p>
          ) : null}
          {message ? <p className="mt-4 rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay">{message}</p> : null}
          <div className="mt-6 grid gap-4">
            {discordReady ? (
              <a
                href="/api/auth/discord"
                className="inline-flex items-center justify-center rounded-full bg-[#5865F2] px-4 py-3 text-sm font-medium text-white hover:bg-[#4752c4]"
              >
                Continuer avec Discord
              </a>
            ) : (
              <p className="rounded-xl border border-[#eadcc0] px-3 py-2 text-sm text-ink-soft">
                Discord n’est pas encore branché (DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, APP_URL).
              </p>
            )}
            <details className="rounded-2xl border border-[#eadcc0] bg-white/40 px-4 py-3">
              <summary className="cursor-pointer text-sm text-ink-soft">Accès gardien (mot de passe)</summary>
              <div className="mt-4">
                <ActionForm action={login}>
                  <Field label="Nom d’utilisateur">
                    <input name="username" autoComplete="username" required className={inputClass} />
                  </Field>
                  <Field label="Mot de passe">
                    <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
                  </Field>
                  <Button type="submit" className="mt-2">
                    Prendre place
                  </Button>
                </ActionForm>
              </div>
            </details>
            <p className="text-sm">
              <Link href="/parvis" className="text-gold-deep">
                Lire les décrets, sans connexion
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
