// Khung bảng ý tưởng thu gọn bên phải kênh chat.
import Link from "next/link";
import { ArrowUpRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToneDot } from "@/components/common/tone-badge";
import { BoardItemCard } from "@/features/board/board-item-card";
import { IDEA_COLUMNS, ideaStatusMeta, type Tone } from "@/lib/status";
import type { BoardCard } from "@/lib/types";

export function BoardPanel({
  workspaceId,
  items,
  explorePath,
}: {
  workspaceId: string;
  items: BoardCard[];
  explorePath?: string;
}) {
  const ideas = items.filter((i) => i.kind === "idea");
  const notes = items.filter((i) => i.kind === "note");

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-sidebar lg:flex">
      <div className="flex-1 scrollbar-thin overflow-y-auto px-2 pb-3">
        <Link
          href={`/w/${workspaceId}/board`}
          className="mx-2 mt-4 flex items-center gap-1 text-xs font-bold tracking-wide text-subtle uppercase hover:text-muted-foreground"
        >
          Bảng ý tưởng · {ideas.length + notes.length} mục
          <ArrowUpRight className="ml-auto size-3.5" />
        </Link>
        {IDEA_COLUMNS.map((status) => (
          <PanelGroup
            key={status}
            tone={ideaStatusMeta[status].tone}
            label={ideaStatusMeta[status].label}
            items={ideas.filter((i) => i.status === status)}
          />
        ))}
        <PanelGroup tone="neutral" label="Ghi chú" items={notes} />
      </div>

      {explorePath ? (
        <div className="m-2 rounded-lg bg-card p-3">
          <p className="text-[13px] font-semibold text-sidebar-accent-foreground">Đưa ý này ra nhóm?</p>
          <p className="mt-1 text-xs leading-relaxed text-subtle">
            Tìm một workspace chung và xin tham gia, mang theo những gì bạn đã nghĩ ở đây.
          </p>
          <Button asChild size="sm" className="mt-2 w-full">
            <Link href={explorePath}>
              <Compass /> Khám phá workspace
            </Link>
          </Button>
        </div>
      ) : null}
    </aside>
  );
}

function PanelGroup({ tone, label, items }: { tone: Tone; label: string; items: BoardCard[] }) {
  if (items.length === 0) return null;
  return (
    <section className="pt-4">
      <h3 className="mb-1 flex items-center gap-1.5 px-2 text-xs font-bold tracking-wide text-subtle uppercase">
        <ToneDot tone={tone} />
        {label} — {items.length}
      </h3>
      {items.map((i) => (
        <BoardItemCard key={i.id} item={i} compact />
      ))}
    </section>
  );
}
