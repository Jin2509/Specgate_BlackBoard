// Ảnh đại diện tròn của người hoặc agent LLM, có chấm trạng thái tùy chọn.
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: "size-5 text-[10px] [&_svg]:size-3",
  sm: "size-8 text-xs [&_svg]:size-4",
  md: "size-10 text-sm [&_svg]:size-5",
  lg: "size-20 text-2xl [&_svg]:size-9",
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
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        aria-label={kind === "agent" ? "agent" : undefined}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-semibold text-primary-foreground",
          kind === "agent" ? "bg-primary" : "bg-secondary",
          SIZES[size],
        )}
      >
        {kind === "agent" ? <Bot /> : initial}
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

export function AiTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-4 items-center rounded bg-primary px-1 text-[10px] leading-none font-semibold text-primary-foreground",
        className,
      )}
    >
      AI
    </span>
  );
}
