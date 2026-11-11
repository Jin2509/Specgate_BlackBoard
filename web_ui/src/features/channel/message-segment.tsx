// Hiển thị một đoạn nội dung tin nhắn: chữ, nhắc tên, lệnh, tham chiếu.
import { FlaskConical } from "lucide-react";
import type { Segment } from "@/lib/types";

export function MessageSegment({ seg }: { seg: Segment }) {
  switch (seg.t) {
    case "text":
      return <>{seg.v}</>;
    case "mention":
      return (
        <span className="rounded-[3px] bg-primary-soft px-0.5 font-medium text-primary-strong hover:bg-primary hover:text-primary-foreground">
          @{seg.v}
        </span>
      );
    case "command":
      return <code className="rounded-[3px] bg-input px-1 py-px font-mono text-[13px] text-muted-foreground">{seg.v}</code>;
    case "flag":
      return <span className="font-medium text-rejected">{seg.v}</span>;
    case "ref":
      return (
        <span className="mx-0.5 inline-flex items-center gap-1 rounded-[3px] bg-data-soft px-1 align-baseline text-[13px] font-medium text-data">
          <FlaskConical className="size-3" />
          {seg.ref.label}
        </span>
      );
  }
}
