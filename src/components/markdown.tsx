import type { ReactNode } from "react";

function safeHref(href: string) {
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (/^https?:\/\//i.test(href)) return href;
  if (/^mailto:/i.test(href)) return href;
  return null;
}

function safeSrc(src: string) {
  if (src.startsWith("/api/media/")) return src;
  if (/^https?:\/\//i.test(src)) return src;
  return null;
}

const IMAGE_LINE_RE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/;

function parseFigureMeta(title = "") {
  let size = "md";
  let place = "center";
  let w: number | null = null;
  let x: number | null = null;
  let y: number | null = null;
  for (const part of title.split(/[;\s]+/)) {
    const [key, value] = part.split(":");
    if (!key || value === undefined || value === "") continue;
    if ((key === "s" || key === "size") && /^(sm|md|lg|full)$/.test(value)) size = value;
    if ((key === "p" || key === "place") && /^(left|center|right|float-left|float-right)$/.test(value)) place = value;
    if (key === "w" && Number.isFinite(Number(value))) w = Math.min(100, Math.max(10, Number(value)));
    if (key === "x" && Number.isFinite(Number(value))) x = Math.min(100, Math.max(0, Number(value)));
    if (key === "y" && Number.isFinite(Number(value))) y = Math.min(100, Math.max(0, Number(value)));
  }
  const widthFromSize = size === "sm" ? 32 : size === "lg" ? 72 : size === "full" ? 100 : 52;
  return { size, place, w: w ?? widthFromSize, x, y, free: x !== null && y !== null };
}

function figureNode(alt: string, rawSrc: string, title: string, id: string) {
  const src = safeSrc(rawSrc);
  if (!src) return alt ? `![${alt}](${rawSrc})` : `![](${rawSrc})`;
  const meta = parseFigureMeta(title);
  if (meta.free) {
    return (
      <figure
        key={id}
        className="book-fig-free"
        style={{ width: `${meta.w}%`, left: `${meta.x}%`, top: `${meta.y}%` }}
      >
        <img src={src} alt={alt} />
        {alt && alt !== "illustration" ? <figcaption>{alt}</figcaption> : null}
      </figure>
    );
  }
  return (
    <figure key={id} className="book-fig" data-size={meta.size} data-place={meta.place} style={{ width: `${meta.w}%` }}>
      <img src={src} alt={alt} />
      {alt && alt !== "illustration" ? <figcaption>{alt}</figcaption> : null}
    </figure>
  );
}

function inline(text: string, key: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*/g;
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    const id = `${key}-${index++}`;
    if (match[2]) {
      const src = safeSrc(match[2]);
      const meta = parseFigureMeta(match[3] ?? "");
      nodes.push(
        src ? (
          <img
            key={id}
            src={src}
            alt={match[1] ?? ""}
            className="book-fig-inline"
            data-size={meta.size}
            data-place={meta.place}
          />
        ) : (
          match[0]
        ),
      );
    } else if (match[4] && match[5]) {
      const href = safeHref(match[5]);
      nodes.push(
        href ? (
          <a key={id} href={href} className="text-leaf underline decoration-gold/70 underline-offset-4">
            {match[4]}
          </a>
        ) : (
          match[0]
        ),
      );
    } else if (match[6]) nodes.push(<strong key={id}>{match[6]}</strong>);
    else if (match[7]) nodes.push(<code key={id} className="rounded bg-[#efe2c6] px-1 py-0.5 text-[0.92em]">{match[7]}</code>);
    else if (match[8]) nodes.push(<em key={id}>{match[8]}</em>);
    last = start + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function splitRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

/** Un retour à la ligne simple devient un vrai saut ; plusieurs lignes vides restent visibles. */
function withSoftBreaks(lines: string[], key: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  lines.forEach((line, index) => {
    if (index > 0) nodes.push(<br key={`${key}-br-${index}`} />);
    nodes.push(...inline(line, `${key}-ln-${index}`));
  });
  return nodes;
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let n = 0;
  const key = () => `md-${n++}`;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (!line.trim()) {
      let blanks = 0;
      while (i < lines.length && !(lines[i] ?? "").trim()) {
        blanks += 1;
        i += 1;
      }
      blocks.push(<div key={key()} className="ink-blank" style={{ height: `${blanks * 1.55}em` }} aria-hidden="true" />);
      continue;
    }
    const loneImage = IMAGE_LINE_RE.exec(line.trim());
    if (loneImage) {
      blocks.push(figureNode(loneImage[1] ?? "", loneImage[2] ?? "", loneImage[3] ?? "", key()));
      i += 1;
      continue;
    }
    if (line.startsWith("```")) {
      const buffer: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        buffer.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push(
        <pre key={key()} className="my-4 overflow-x-auto rounded-lg bg-[#2a2118] p-4 text-sm text-parchment">
          <code>{buffer.join("\n")}</code>
        </pre>,
      );
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={key()} className="my-6 border-[#e0cfaa]" />);
      i += 1;
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const Tag = heading[1].length === 1 ? "h2" : heading[1].length === 2 ? "h3" : "h4";
      blocks.push(
        <Tag key={key()} className="mt-8 mb-3">
          {inline(heading[2], key())}
        </Tag>,
      );
      i += 1;
      continue;
    }
    if (line.trim().startsWith("|") && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1] ?? "")) {
      const header = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && (lines[i] ?? "").trim().startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i += 1;
      }
      blocks.push(
        <div key={key()} className="my-4 overflow-x-auto">
          <table>
            <thead>
              <tr>
                {header.map((cell) => (
                  <th key={cell}>{inline(cell, key())}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{inline(cell, key())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (line.startsWith(">")) {
      const buffer: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        buffer.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push(
        <blockquote key={key()} className="my-4 border-l-2 border-gold pl-4 text-ink-soft italic">
          {withSoftBreaks(buffer, key())}
        </blockquote>,
      );
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={key()} className="my-4 list-disc space-y-1 pl-5">
          {items.map((item, index) => (
            <li key={index}>{inline(item, key())}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ol key={key()} className="my-4 list-decimal space-y-1 pl-5">
          {items.map((item, index) => (
            <li key={index}>{inline(item, key())}</li>
          ))}
        </ol>,
      );
      continue;
    }
    const buffer = [line];
    i += 1;
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() &&
      !IMAGE_LINE_RE.test((lines[i] ?? "").trim()) &&
      !/^(#{1,3}\s|```|>\s?|---|\s*[-*]\s|\s*\d+\.\s|\|)/.test(lines[i] ?? "")
    ) {
      buffer.push(lines[i] ?? "");
      i += 1;
    }
    blocks.push(
      <p key={key()} className="ink-para">
        {withSoftBreaks(buffer, key())}
      </p>,
    );
  }

  return <div className="ink font-serif text-[1.05rem]">{blocks}</div>;
}
