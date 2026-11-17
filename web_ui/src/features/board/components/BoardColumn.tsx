// Renders one status column of the idea board.
import { SectionLabel } from "@/components/SectionLabel";
import { t } from "@/lib/i18n";
import type { BoardCard, IdeaStatus } from "@/types/board";
import { IDEA_STATUS_META } from "@/utils/status-meta";

import { BoardItemCard } from "./BoardItemCard";

export function BoardColumn({
  status,
  cards,
  onSelect,
}: {
  status: IdeaStatus;
  cards: BoardCard[];
  onSelect: (cardId: string) => void;
}) {
  const canDecide = status === "proposed" || status === "discussing";

  return (
    <section className="flex min-w-0 flex-col gap-2">
      <SectionLabel className="px-1">
        {IDEA_STATUS_META[status].label} ({cards.length})
      </SectionLabel>
      {cards.map((card) => (
        <BoardItemCard key={card.id} card={card} onClick={canDecide ? () => onSelect(card.id) : undefined} />
      ))}
      {cards.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-subtle">
          {t.board.emptyColumn}
        </p>
      ) : null}
    </section>
  );
}
