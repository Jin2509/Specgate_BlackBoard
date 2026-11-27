// Renders one card of the idea board: number, body, parts with their speakers, reason and who decided.
import { ChevronRight, Terminal, User } from "lucide-react";

import { format, t } from "@/lib/i18n";
import type { BoardCard } from "@/types/board";
import { cn } from "@/utils/cn";
import { IDEA_STATUS_META } from "@/utils/status-meta";

export function toCardFooter(card: BoardCard, isCompact: boolean): string {
  if (card.decidedBy && card.status) {
    const verb = IDEA_STATUS_META[card.status].verb;
    return format(t.board.decidedFooter, { name: card.deciderName ?? "", verb, time: card.decidedAtLabel ?? "" }).replace(
      /, $/,
      "",
    );
  }
  return isCompact ? card.authorName : `${card.authorName}, ${card.atLabel}`;
}

function AuthorIcon({ kind }: { kind: BoardCard["createdBy"]["kind"] }) {
  if (kind === "agent") return <Terminal className="size-3" />;
  return <User className="size-3" />;
}

export function BoardItemCard({
  card,
  isCompact = false,
  onClick,
  className,
}: {
  card: BoardCard;
  isCompact?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const status = card.kind === "idea" ? card.status : null;
  const isRejected = status === "rejected";
  const Container = onClick ? "button" : "div";

  return (
    <Container
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "block w-full text-left transition-colors",
        isCompact ? "rounded px-2 py-1.5" : "rounded-lg bg-card p-3",
        onClick &&
          "group/card cursor-pointer border border-border shadow-xs hover:border-ring hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      <p
        className={cn(
          isCompact ? "line-clamp-2 text-[0.8125rem] leading-snug text-muted-foreground" : "text-sm leading-snug text-foreground",
          isRejected && "text-subtle line-through",
        )}
      >
        {!isCompact && card.kind === "idea" ? <span className="mr-1.5 font-mono text-xs text-subtle">#{card.number}</span> : null}
        {card.parts?.length ? null : card.body}
      </p>

      {card.parts?.length ? (
        <ul className={cn("space-y-1", isCompact ? "text-[0.8125rem]" : "text-sm")}>
          {card.parts.map((part, index) => (
            <li key={index} className={cn(isCompact && "line-clamp-2", isRejected && "text-subtle line-through")}>
              <span className="font-medium text-muted-foreground">{part.speaker}: </span>
              {part.text}
            </li>
          ))}
        </ul>
      ) : null}

      {card.reason && status ? (
        <p className={cn("text-xs leading-relaxed text-subtle", isCompact ? "mt-0.5 line-clamp-1" : "mt-2")}>
          <span className="font-medium text-muted-foreground">{t.board.reasonLabel}</span> {card.reason}
        </p>
      ) : null}

      <div className={cn("flex flex-wrap items-center gap-1.5 text-[0.6875rem] text-subtle", isCompact ? "mt-0.5" : "mt-2")}>
        <AuthorIcon kind={card.createdBy.kind} />
        <span>{toCardFooter(card, isCompact)}</span>
        {onClick ? (
          <span className="ml-auto inline-flex items-center gap-0.5 font-medium text-primary-strong">
            {t.board.decideHint}
            <ChevronRight className="size-3 transition-transform group-hover/card:translate-x-0.5" />
          </span>
        ) : null}
      </div>
    </Container>
  );
}
