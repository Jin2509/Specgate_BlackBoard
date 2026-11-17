// Renders the small "agent" tag next to an agent's name.
import { t } from "@/lib/i18n";
import { cn } from "@/utils/cn";

export function AiTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-4 items-center rounded-sm border border-agent-line px-1 text-[10.5px] leading-none font-medium text-agent",
        className,
      )}
    >
      {t.common.agentTag}
    </span>
  );
}
