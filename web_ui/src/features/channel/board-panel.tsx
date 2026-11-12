// Khung bảng ý tưởng thu gọn bên phải kênh chat.
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BoardItemCard } from "@/features/board/board-item-card";
import { IDEA_COLUMNS, ideaStatusMeta } from "@/lib/status";
import type { BoardCard } from "@/lib/types";

export function BoardPanel({ workspaceId, items }: { workspaceId: string; items: BoardCard[] }) {
  const ideas = items.filter((i) => i.kind === "idea");
  const notes = items.filter((i) => i.kind === "note");

  return (
    <aside aria-label="Bảng ý tưởng" className="flex h-full w-full flex-col border-l border-sidebar-border bg-card">
      <div className="flex-1 scrollbar-thin overflow-y-auto px-2 pb-3">
        <Link
          href={`/w/${workspaceId}/board`}
          className="mx-2 mt-4 flex items-center gap-1 text-[13px] font-semibold text-subtle hover:text-muted-foreground"
        >
          Bảng ý tưởng, {ideas.length + notes.length} mục
          <ArrowUpRight className="ml-auto size-3.5" />
        </Link>
        {IDEA_COLUMNS.map((status) => (
          <PanelGroup key={status} label={ideaStatusMeta[status].label} items={ideas.filter((i) => i.status === status)} />
        ))}
        <PanelGroup label="Ghi chú" items={notes} />
      </div>
    </aside>
  );
}

function PanelGroup({ label, items }: { label: string; items: BoardCard[] }) {
  if (items.length === 0) return null;
  return (
    <section className="pt-4">
      <h3 className="mb-1 flex items-center gap-1.5 px-2 text-[13px] font-semibold text-subtle">
        {label} ({items.length})
      </h3>
      {items.map((i) => (
        <BoardItemCard key={i.id} item={i} compact />
      ))}
    </section>
  );
}
