import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Button, Field, Mark, inputClass } from "@/components/ui";
import { login } from "@/server/session";

export const dynamic = "force-dynamic";

export default function ConnexionPage() {
  const ready = Boolean(process.env.DATABASE_URL && process.env.AUTH_SECRET);
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
            Les décrets se lisent sur l’espace public. La table — annuaire, bibliothèque, recensement, offices — s’ouvre avec un nom d’utilisateur.
          </p>
        </div>
        <p className="text-sm text-sap/70">Ce qui est écrit ici reste dans la nation.</p>
      </section>
      <section className="flex items-center px-6 py-10 md:px-12">
        <div className="form-sheet w-full">
          <h2 className="font-display text-4xl">Entrer</h2>
          <p className="mt-2 text-sm text-ink-soft">Le nom d’utilisateur est celui inscrit sur la table.</p>
          {!ready ? (
            <p className="mt-4 rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay">
              Relie d’abord Neon : DATABASE_URL et AUTH_SECRET manquent dans .env.local.
            </p>
          ) : null}
          <div className="mt-6">
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
            <p className="mt-5 text-sm">
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
