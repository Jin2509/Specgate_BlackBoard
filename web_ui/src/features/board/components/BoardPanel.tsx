// Renders the compact idea board in the right column of a channel.
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { format, t } from "@/lib/i18n";
import type { BoardCard } from "@/types/board";
import { IDEA_COLUMNS, IDEA_STATUS_META } from "@/utils/status-meta";

import { BoardItemCard } from "./BoardItemCard";

export function BoardPanel({ workspaceId, cards }: { workspaceId: string; cards: BoardCard[] }) {
  const ideas = cards.filter((card) => card.kind === "idea");
  const notes = cards.filter((card) => card.kind === "note");

  return (
    <aside aria-label={t.board.panelLabel} className="flex h-full w-full flex-col border-l border-sidebar-border bg-card">
      <div className="flex-1 scrollbar-thin overflow-y-auto px-2 pb-3">
        <Link
          href={`/w/${workspaceId}/board`}
          className="mx-2 mt-4 flex items-center gap-1 text-[0.8125rem] font-semibold text-subtle hover:text-muted-foreground"
        >
          {format(t.board.panelHeading, { count: ideas.length + notes.length })}
          <ArrowUpRight className="ml-auto size-3.5" />
        </Link>
        {IDEA_COLUMNS.map((status) => (
          <PanelGroup
            key={status}
            label={IDEA_STATUS_META[status].label}
            cards={ideas.filter((card) => card.status === status)}
          />
        ))}
        <PanelGroup label={t.board.notes} cards={notes} />
      </div>
    </aside>
  );
}

function PanelGroup({ label, cards }: { label: string; cards: BoardCard[] }) {
  if (cards.length === 0) return null;
  return (
    <section className="pt-4">
      <h3 className="mb-1 flex items-center gap-1.5 px-2 text-[0.8125rem] font-semibold text-subtle">
        {label} ({cards.length})
      </h3>
      {cards.map((card) => (
        <BoardItemCard key={card.id} card={card} isCompact />
      ))}
    </section>
  );
}
