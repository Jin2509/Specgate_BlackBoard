// Bảng ý tưởng bốn cột trạng thái và hộp thoại chốt/loại.
"use client";

import Link from "next/link";
import { FileText, KanbanSquare, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageBody, PageHeader, PageLayout } from "@/components/common/page-header";
import { useQueryParam } from "@/hooks/use-query-param";
import { IDEA_COLUMNS } from "@/lib/status";
import type { BoardCard, Profile } from "@/lib/types";
import { BoardColumn } from "./board-column";
import { BoardFooter } from "./board-footer";
import type { Decision } from "./decide-command";
import { DecideDialog } from "./decide-dialog";

const DEMO_REASONS: Record<string, string> = {
  i4: "Thư viện đã được kiểm thử kỹ, khó ra kết quả trong 3 tuần. Giữ kỹ thuật, đổi sang bộ phân tích cron.",
};

export function BoardView({
  workspaceId,
  viewer,
  initialItems,
}: {
  workspaceId: string;
  viewer: Profile;
  initialItems: BoardCard[];
}) {
  const [items, setItems] = useState(initialItems);
  const decideFlag = useQueryParam("decide");
  const [selected, setSelected] = useState<string | null>(null);
  const [dismissedFlag, setDismissedFlag] = useState(false);
  const openId = selected ?? (dismissedFlag ? null : decideFlag);
  const openItem = items.find((i) => i.id === openId);

  const ideas = items.filter((i) => i.kind === "idea");
  const notes = items.filter((i) => i.kind === "note");
  const questions = items.filter((i) => i.kind === "question");
  const summary = items.filter((i) => i.kind === "summary").at(-1);

  function decide(id: string, decision: Decision, reason: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: decision, reason, decidedBy: { id: viewer.id, at: "vừa xong" }, deciderName: viewer.displayName }
          : i,
      ),
    );
  }

  return (
    <PageLayout>
      <PageHeader
        icon={<KanbanSquare />}
        title="Bảng ý tưởng"
        meta={`${ideas.length} ý · ${notes.length} ghi chú · ${questions.length} câu hỏi`}
        actions={
          <>
            <Button variant="secondary" size="sm">
              <Plus /> <span className="max-sm:sr-only">Thêm ý</span>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/w/${workspaceId}/brief`}>
                <FileText /> <span className="max-sm:sr-only">Bản tổng hợp</span>
              </Link>
            </Button>
          </>
        }
      />

      <PageBody className="flex flex-col gap-6">
        <div className="grid content-start gap-4 @2xl:grid-cols-2 @5xl:grid-cols-4">
          {IDEA_COLUMNS.map((status) => (
            <BoardColumn key={status} status={status} items={ideas.filter((i) => i.status === status)} onSelect={setSelected} />
          ))}
        </div>
        <BoardFooter notes={notes} questions={questions} summary={summary} />
      </PageBody>

      <DecideDialog
        key={openItem?.id}
        item={openItem}
        open={Boolean(openItem)}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            setDismissedFlag(true);
          }
        }}
        initialReason={openItem && openItem.id === decideFlag ? (DEMO_REASONS[openItem.id] ?? "") : ""}
        onConfirm={(d, r) => openItem && decide(openItem.id, d, r)}
      />
    </PageLayout>
  );
}
