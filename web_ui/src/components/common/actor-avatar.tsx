// Ảnh đại diện: người là hình tròn có chữ cái đầu; agent là ô vuông bo góc có chữ cái đầu của tên gọi,
// để phân biệt người và agent bằng hình dạng thay vì biểu tượng robot.
import { cn } from "@/lib/utils";

const SIZES = {
  xs: "size-5 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-20 text-2xl",
} as const;

export function ActorAvatar({
  kind,
  initial,
  size = "md",
  online,
  className,
}: {
  kind: "human" | "agent";
  initial?: string;
  size?: keyof typeof SIZES;
  online?: boolean;
  className?: string;
}) {
  const letter = (initial ?? (kind === "agent" ? "A" : "?")).slice(0, 1).toUpperCase();
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        aria-label={kind === "agent" ? "agent" : undefined}
        className={cn(
          "inline-flex items-center justify-center font-semibold",
          kind === "agent"
            ? "rounded-[30%] border border-agent-line bg-agent-soft text-agent"
            : "rounded-full bg-secondary text-secondary-foreground",
          SIZES[size],
        )}
      >
        {letter}
      </span>
      {online !== undefined ? (
        <span
          aria-hidden
          className={cn(
            "absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-[3px] border-sidebar-footer",
            online ? "bg-decided" : "bg-subtle",
          )}
        />
      ) : null}
    </span>
  );
}

// Nhãn nhỏ cạnh tên agent trong tin nhắn và gợi ý.
export function AiTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-4 items-center rounded-sm border border-agent-line px-1 text-[10.5px] leading-none font-medium text-agent",
        className,
      )}
    >
      agent
    </span>
  );
}
