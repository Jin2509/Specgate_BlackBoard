// Renders the team's notes and where the channel summary comes from, below the board.
import { ListCollapse, StickyNote } from "lucide-react";

import { Panel } from "@/components/Panel";
import { t } from "@/lib/i18n";
import type { BoardCard } from "@/types/board";

export function BoardFooter({ notes }: { notes: BoardCard[] }) {
  return (
    <div className="grid gap-4 @3xl:grid-cols-2">
      <Panel
        icon={<StickyNote />}
        title={t.board.notes}
        bodyClassName="space-y-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground"
      >
        {notes.map((note) => (
          <p key={note.id}>
            <span className="mr-1.5 font-mono text-xs text-subtle">#{note.number}</span>
            {note.body}
          </p>
        ))}
        {notes.length === 0 ? <p className="text-subtle">{t.board.noNotes}</p> : null}
      </Panel>
      <Panel
        icon={<ListCollapse />}
        title={t.board.channelSummary}
        bodyClassName="text-[0.8125rem] leading-relaxed text-muted-foreground"
      >
        <p>{t.board.channelSummaryHint}</p>
      </Panel>
    </div>
  );
}
