// Nội dung bản tổng hợp dựng từ bảng ý tưởng.
import { Check, CircleHelp, FileText, MessagesSquare, StickyNote, X } from "lucide-react";
import { PageBody, PageHeader, PageLayout } from "@/components/common/page-header";
import { briefToMarkdown, buildBrief, lowerFirst } from "@/lib/brief";
import type { BoardCard } from "@/lib/types";
import { BriefActions } from "./brief-actions";
import { BriefRow, BriefSection } from "./brief-section";

export function BriefView({ title, brief, items, meta }: { title: string; brief: string; items: BoardCard[]; meta: string }) {
  const model = buildBrief(title, items);

  return (
    <PageLayout>
      <PageHeader
        icon={<FileText />}
        title="Bản tổng hợp"
        meta="dựng từ bảng ý tưởng"
        actions={<BriefActions markdown={briefToMarkdown(model, brief)} />}
      />
      <PageBody>
        <article className="mx-auto max-w-4xl rounded-lg bg-card px-6 py-6 md:px-10 md:py-8">
          <p className="text-xs font-bold tracking-wide text-subtle uppercase">Bản tổng hợp</p>
          <h2 className="mt-1 text-2xl font-bold text-sidebar-accent-foreground">{model.title}</h2>
          <p className="mt-1 text-xs text-subtle">{meta}</p>

          <div className="mt-6 grid gap-x-12 gap-y-6 border-t border-border pt-6 @3xl:grid-cols-2">
            <div className="space-y-6">
              <BriefSection icon={<Check />} title="Đã chốt" tone="text-decided">
                {model.decided.map((i) => (
                  <BriefRow key={i.id} title={i.body} strong>
                    Vì {lowerFirst(i.reason)} {i.decidedBy ? `${i.deciderName} chốt, ${i.decidedBy.at}.` : ""}
                  </BriefRow>
                ))}
              </BriefSection>
              <BriefSection icon={<X />} title="Đã loại" tone="text-rejected">
                {model.rejected.map((i) => (
                  <BriefRow key={i.id} title={i.body}>
                    Vì {lowerFirst(i.reason)}
                  </BriefRow>
                ))}
              </BriefSection>
            </div>
            <div className="space-y-6">
              <BriefSection icon={<MessagesSquare />} title="Còn đang bàn" tone="text-discussing">
                {model.discussing.map((i) => (
                  <BriefRow key={i.id} title={i.body} />
                ))}
              </BriefSection>
              <BriefSection icon={<CircleHelp />} title="Câu hỏi mở" tone="text-proposed">
                {model.openQuestions.map((i) => (
                  <BriefRow key={i.id} title={i.body} />
                ))}
              </BriefSection>
              <BriefSection icon={<StickyNote />} title="Ràng buộc đã ghi" tone="text-muted-foreground">
                <p className="text-[13px] text-muted-foreground">{model.notes.map((n) => n.body).join(" ")}</p>
              </BriefSection>
            </div>
          </div>
        </article>
      </PageBody>
    </PageLayout>
  );
}
