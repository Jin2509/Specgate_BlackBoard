// Một cột trạng thái của bảng ý tưởng.
import { SectionLabel } from "@/components/common/panel";
import { ideaStatusMeta } from "@/lib/status";
import type { BoardCard, IdeaStatus } from "@/lib/types";
import { BoardItemCard } from "./board-item-card";

export function BoardColumn({
  status,
  items,
  onSelect,
}: {
  status: IdeaStatus;
  items: BoardCard[];
  onSelect: (id: string) => void;
}) {
  const meta = ideaStatusMeta[status];
  const canDecide = status === "proposed" || status === "discussing";

  return (
    <section className="flex min-w-0 flex-col gap-2">
      <SectionLabel className="px-1">
        {meta.label} ({items.length})
      </SectionLabel>
      {items.map((i) => (
        <BoardItemCard key={i.id} item={i} onClick={canDecide ? () => onSelect(i.id) : undefined} />
      ))}
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-subtle">Chưa có ý nào</p>
      ) : null}
    </section>
  );
}
