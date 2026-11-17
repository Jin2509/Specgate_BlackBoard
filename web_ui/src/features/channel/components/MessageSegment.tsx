// Renders one segment of a message body: text, mention or command.
import type { Segment } from "@/types/message";

export function MessageSegment({ segment }: { segment: Segment }) {
  switch (segment.t) {
    case "text":
      return <>{segment.v}</>;
    case "mention":
      return (
        <span className="rounded-[3px] bg-primary-soft px-0.5 font-medium text-primary-strong hover:bg-primary hover:text-primary-foreground">
          @{segment.v}
        </span>
      );
    case "command":
      return <code className="rounded-[3px] bg-input px-1 py-px font-mono text-[13px] text-muted-foreground">{segment.v}</code>;
  }
}
