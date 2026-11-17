// Renders a person (round, filled with their colour) or an agent (rounded square outlined in its owner's colour).
import { t } from "@/lib/i18n";
import { toAvatarColor } from "@/utils/avatar-color";
import { cn } from "@/utils/cn";

const SIZE_CLASSES = {
  xs: "size-5 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-20 text-2xl",
} as const;

export function ActorAvatar({
  kind,
  initial,
  colorIndex,
  size = "md",
  isOnline,
  title,
  className,
}: {
  kind: "human" | "agent";
  initial?: string;
  colorIndex?: number;
  size?: keyof typeof SIZE_CLASSES;
  isOnline?: boolean;
  title?: string;
  className?: string;
}) {
  const letter = (initial ?? (kind === "agent" ? "A" : "?")).slice(0, 1).toUpperCase();
  const tint = toAvatarColor(colorIndex);
  const style =
    tint === undefined
      ? undefined
      : kind === "agent"
        ? { borderColor: tint, color: tint }
        : { backgroundColor: tint, color: "var(--primary-foreground)" };
  return (
    <span className={cn("relative inline-flex shrink-0", className)} title={title}>
      <span
        aria-label={kind === "agent" ? t.common.agentTag : undefined}
        style={style}
        className={cn(
          "inline-flex items-center justify-center font-semibold",
          kind === "agent"
            ? "rounded-[30%] border-2 border-agent-line bg-agent-soft text-agent"
            : "rounded-full bg-secondary text-secondary-foreground",
          SIZE_CLASSES[size],
        )}
      >
        {letter}
      </span>
      {isOnline !== undefined ? (
        <span
          aria-hidden
          className={cn(
            "absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-[3px] border-sidebar-footer",
            isOnline ? "bg-decided" : "bg-subtle",
          )}
        />
      ) : null}
    </span>
  );
}
