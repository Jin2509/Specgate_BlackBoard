// Thẻ trích dẫn của một highlight: vệt phấn vàng bên trái, nhãn, người tạo. Dùng ở kênh chung và danh sách "Highlight của tôi".
import type { ReactNode } from "react";
import { highlightLabelMeta } from "@/lib/status";
import type { HighlightLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

export function HighlightQuote({
  text,
  label,
  byline,
  actions,
  className,
}: {
  text: string;
  label: HighlightLabel;
  byline: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <figure className={cn("max-w-xl rounded-r-md border-l-[3px] border-mark-line bg-card py-2 pr-3 pl-3", className)}>
      <blockquote className="text-[14.5px] leading-relaxed text-foreground">
        <span className="chalk-mark box-decoration-clone">{text}</span>
      </blockquote>
      <figcaption className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-subtle">
        <span className="rounded-sm bg-primary-soft px-1.5 py-px font-medium text-primary-strong">
          {highlightLabelMeta[label].label}
        </span>
        <span>chưa chốt</span>
        <span aria-hidden>/</span>
        <span>{byline}</span>
        {actions ? <span className="ml-auto flex items-center gap-1">{actions}</span> : null}
      </figcaption>
    </figure>
  );
}
