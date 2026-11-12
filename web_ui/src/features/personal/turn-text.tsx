// Nội dung một lượt chat: tách đoạn theo dòng trống, dòng bắt đầu bằng "1." thành danh sách.
// withMarks tô vệt phấn vàng ở những đoạn đã highlight; kênh chung cũng dùng hàm này.
import type { ReactNode } from "react";

export function withMarks(text: string, marks: string[]): ReactNode {
  const found = marks
    .map((m) => ({ m, i: text.indexOf(m) }))
    .filter((x) => x.i >= 0)
    .sort((a, b) => a.i - b.i);
  if (found.length === 0) return text;
  const out: ReactNode[] = [];
  let at = 0;
  for (const { m, i } of found) {
    if (i < at) continue;
    if (i > at) out.push(text.slice(at, i));
    out.push(
      <mark key={i} className="chalk-mark bg-transparent text-inherit">
        {m}
      </mark>,
    );
    at = i + m.length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

export function TurnText({ text, marks = [] }: { text: string; marks?: string[] }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-3">
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        if (lines.every((l) => /^\d+\.\s/.test(l))) {
          return (
            <ol key={bi} className="list-decimal space-y-1.5 pl-5 marker:text-subtle">
              {lines.map((l, li) => (
                <li key={li}>{withMarks(l.replace(/^\d+\.\s/, ""), marks)}</li>
              ))}
            </ol>
          );
        }
        return <p key={bi}>{withMarks(block, marks)}</p>;
      })}
    </div>
  );
}
