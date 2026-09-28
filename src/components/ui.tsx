import type { ButtonHTMLAttributes, ReactNode } from "react";
import { initials } from "@/lib/format";
import { mediaPath } from "@/lib/storage";

export const inputClass =
  "w-full rounded-lg border border-[#e0cfaa] bg-white/70 px-3 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-ink-soft/50 focus:border-leaf focus:bg-white";

export const labelClass = "mb-1.5 block text-[11px] font-medium uppercase tracking-[0.18em] text-gold-deep";

export function Mark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M32 50V16" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M32 36c-8-3-15-10-18-20" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M32 32c8-4 15-11 18-20" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="32" cy="15" r="2.2" fill="currentColor" />
      <circle cx="15" cy="17" r="1.6" fill="currentColor" />
      <circle cx="49" cy="13" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function PageHeader({
  kicker,
  title,
  lede,
  action,
}: {
  kicker: string;
  title: string;
  lede?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{kicker}</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-parchment md:text-5xl">{title}</h1>
        {lede ? <p className="mt-3 max-w-2xl text-sap/90">{lede}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`parchment rounded-3xl p-5 md:p-7 ${className}`}>{children}</section>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-moss text-parchment hover:bg-leaf",
    ghost: "border border-[#d9c7a3] bg-white/40 text-ink hover:bg-white",
    danger: "border border-clay/30 text-clay hover:bg-clay/10",
  };
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm transition disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

export function Badge({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "leaf" | "clay" }) {
  const tones = {
    gold: "bg-[#f3e2bc] text-gold-deep",
    leaf: "bg-[#e3efe4] text-leaf",
    clay: "bg-[#f8e4de] text-clay",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gold/30 px-6 py-12 text-center">
      <p className="font-display text-2xl text-parchment">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-sap/80">{text}</p>
    </div>
  );
}

export function Sealed({ title = "Sceau fermé" }: { title?: string }) {
  return (
    <Panel className="mx-auto max-w-xl text-center">
      <Mark className="mx-auto h-14 w-14 text-gold-deep" />
      <h1 className="mt-4 font-display text-4xl">{title}</h1>
      <p className="mt-3 text-ink-soft">Cette partie des archives ne t’est pas ouverte. Le Gaelor ou le gardien peut desserrer le sceau.</p>
    </Panel>
  );
}

export function Portrait({ storageKey, name, size = "h-16 w-16" }: { storageKey?: string | null; name: string; size?: string }) {
  if (!storageKey) {
    return (
      <div className={`grid ${size} place-items-center rounded-full bg-moss font-display text-lg text-parchment`}>
        {initials(name)}
      </div>
    );
  }
  return <img src={mediaPath(storageKey)} alt="" className={`${size} rounded-full object-cover`} />;
}

export function Notice({ error, ok }: { error?: string; ok?: string }) {
  if (error) return <p className="rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>;
  if (ok) return <p className="rounded-xl bg-leaf/10 px-3 py-2 text-sm text-leaf">{ok}</p>;
  return null;
}
