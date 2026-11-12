// Thẻ một mục trên bảng ý tưởng.
import { FlaskConical, Terminal, User } from "lucide-react";
import { ideaStatusMeta } from "@/lib/status";
import type { BoardCard, IdeaStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function cardFooter(item: BoardCard, compact: boolean): string {
  const status = item.kind === "idea" ? (item.status as IdeaStatus) : undefined;
  if (item.decidedBy && status) return `${item.deciderName} ${ideaStatusMeta[status].verb}, ${item.decidedBy.at}`;
  if (item.critiques) return `${item.authorName}, ${item.critiques} phản biện`;
  return compact ? item.authorName : `${item.authorName}, ${item.at}`;
}

export function BoardItemCard({
  item,
  compact = false,
  onClick,
  className,
}: {
  item: BoardCard;
  compact?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const status = item.kind === "idea" ? (item.status as IdeaStatus) : undefined;
  const rejected = status === "rejected";
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "block w-full text-left transition-colors",
        compact ? "rounded px-2 py-1.5 hover:bg-hover" : "rounded-lg bg-card p-3",
        onClick && "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      <p
        className={cn(
          compact ? "line-clamp-2 text-[13px] leading-snug text-muted-foreground" : "text-sm leading-snug text-foreground",
          rejected && "text-subtle line-through",
        )}
      >
        {!compact && item.kind === "idea" ? <span className="mr-1.5 font-mono text-xs text-subtle">#{item.number}</span> : null}
        {item.body}
      </p>

      {item.latestCritique && !compact ? (
        <p className="mt-2 text-xs leading-relaxed text-subtle">
          <span className="font-medium text-muted-foreground">Phản biện:</span> {item.latestCritique}
        </p>
      ) : null}
      {item.reason && status ? (
        <p className={cn("text-xs leading-relaxed text-subtle", compact ? "mt-0.5 line-clamp-1" : "mt-2")}>
          <span className="font-medium text-muted-foreground">Lý do:</span> {item.reason}
        </p>
      ) : null}

      <div className={cn("flex flex-wrap items-center gap-1.5 text-[11px] text-subtle", compact ? "mt-0.5" : "mt-2")}>
        <SourceIcon item={item} />
        <span>{cardFooter(item, compact)}</span>
        {item.refs?.map((r) => (
          <span
            key={r.label}
            className="inline-flex items-center gap-1 rounded-[3px] bg-data-soft px-1 text-[10.5px] font-medium text-data"
          >
            <FlaskConical className="size-2.5" />
            {r.label}
          </span>
        ))}
      </div>
    </Comp>
  );
}

function SourceIcon({ item }: { item: BoardCard }) {
  return item.createdBy.kind === "agent" ? <Terminal className="size-3" /> : <User className="size-3" />;
}
