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

function inline(text: string, key: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*/g;
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    const id = `${key}-${index++}`;
    if (match[2]) {
      const src = safeSrc(match[2]);
      nodes.push(
        src ? (
          <img key={id} src={src} alt={match[1] ?? ""} className="my-4 max-h-[28rem] rounded-md border border-[#e4d3b0]" />
        ) : (
          match[0]
        ),
      );
    } else if (match[3] && match[4]) {
      const href = safeHref(match[4]);
      nodes.push(
        href ? (
          <a key={id} href={href} className="text-leaf underline decoration-gold/70 underline-offset-4">
            {match[3]}
          </a>
        ) : (
          match[0]
        ),
      );
    } else if (match[5]) nodes.push(<strong key={id}>{match[5]}</strong>);
    else if (match[6]) nodes.push(<code key={id} className="rounded bg-[#efe2c6] px-1 py-0.5 text-[0.92em]">{match[6]}</code>);
    else if (match[7]) nodes.push(<em key={id}>{match[7]}</em>);
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

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let n = 0;
  const key = () => `md-${n++}`;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (!line.trim()) {
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
          {inline(buffer.join(" "), key())}
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
    while (i < lines.length && (lines[i] ?? "").trim() && !/^(#{1,3}\s|```|>\s?|---|\s*[-*]\s|\s*\d+\.\s|\|)/.test(lines[i] ?? "")) {
      buffer.push(lines[i] ?? "");
      i += 1;
    }
    blocks.push(
      <p key={key()} className="my-4 leading-8">
        {inline(buffer.join(" "), key())}
      </p>,
    );
  }

  return <div className="ink font-serif text-[1.05rem]">{blocks}</div>;
}
