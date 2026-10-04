import type { ReactNode } from "react";

export function DecreeSheet({
  reference,
  title,
  preamble,
  status,
  date,
  issuerRole,
  compact = false,
  children,
}: {
  reference: string;
  title: string;
  preamble?: string;
  status: string;
  date: string;
  issuerRole?: string;
  compact?: boolean;
  children?: ReactNode;
}) {
  const Title = compact ? "h2" : "h1";

  return (
    <article className={compact ? "decree-sheet decree-sheet-card" : "decree-sheet"}>
      <div className="flex items-start justify-between gap-3">
        <img src="/gaelia/bouclier.png" alt="" className={compact ? "h-11 w-11 shrink-0" : "h-20 w-20 shrink-0"} />
        <p className="text-right text-[11px] uppercase tracking-[0.16em] text-[#8d6b32]">
          <span className="block font-display text-base tracking-[0.22em] text-[#3c2b20]">Gaélia</span>
          {reference}
          <span className="mt-1 block normal-case tracking-normal">
            {status}
            {date ? ` · ${date}` : ""}
          </span>
          {issuerRole ? (
            <span className="mt-1 block normal-case tracking-normal text-[#6b5644]">Par le {issuerRole}</span>
          ) : null}
        </p>
      </div>
      <Title className={`font-display leading-tight text-[#241910] ${compact ? "mt-2 text-3xl" : "mt-4 text-5xl"}`}>{title}</Title>
      {preamble ? <p className={`font-serif italic leading-7 text-[#3c2b20] ${compact ? "mt-2 line-clamp-3" : "mt-4 text-lg"}`}>{preamble}</p> : null}
      {children ? <div className="mt-2">{children}</div> : null}
      <img src="/gaelia/sceau.png" alt="" className="decree-seal" />
    </article>
  );
}
