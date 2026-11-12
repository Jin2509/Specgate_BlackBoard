// Danh sách highlight của tôi: những đoạn đã đánh dấu trong workspace riêng, chờ gửi vào workspace chung.
import type { Metadata } from "next";
import Link from "next/link";
import { Highlighter, Trash2 } from "lucide-react";
import { PageBody, PageHeader, PageLayout } from "@/components/common/page-header";
import { HighlightQuote } from "@/features/highlight/highlight-quote";
import { getConversations, getHighlights, getRail } from "@/lib/mock/queries";
import { personalHome, sharedHome } from "@/lib/paths";
import { deleteHighlight } from "@/lib/private-actions";
import { requireSession } from "@/lib/session";
import { requirePersonalWorkspace } from "@/lib/workspace-route";

export const metadata: Metadata = { title: "Highlight của tôi" };

export default async function HighlightsPage({ params }: PageProps<"/w/[ws]/chat/highlights">) {
  const ws = await requirePersonalWorkspace(params);
  const { user } = await requireSession();
  const home = personalHome(ws.id);
  const highlights = getHighlights(user.id);
  const titles = Object.fromEntries(getConversations(user.id).map((c) => [c.id, c.title]));
  const shared = getRail(user.id).filter((w) => w.kind === "shared");

  return (
    <PageLayout>
      <PageHeader icon={<Highlighter />} title="Highlight của tôi" meta={`${highlights.length} đoạn`} />
      <PageBody>
        <div className="mx-auto max-w-2xl">
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Đây là những đoạn bạn đánh dấu khi chat. Muốn bàn với nhóm, mở kênh của một workspace chung, gõ{" "}
            <kbd className="rounded bg-muted px-1 font-sans text-[13px] text-foreground">@</kbd> rồi chọn highlight. Agent ở đó
            đọc được đoạn này và biết nó chưa được chốt.
          </p>
          {shared.length > 0 ? (
            <p className="mt-2 text-sm text-subtle">
              Workspace chung của bạn:{" "}
              {shared.map((w, i) => (
                <span key={w.id}>
                  {i > 0 ? ", " : null}
                  <Link href={sharedHome(w.id)} className="text-primary-strong underline-offset-2 hover:underline">
                    {w.name}
                  </Link>
                </span>
              ))}
            </p>
          ) : null}

          <ul className="mt-6 space-y-3">
            {highlights.map((h) => (
              <li key={h.id}>
                <HighlightQuote
                  className="max-w-none"
                  text={h.text}
                  label={h.label}
                  byline={
                    titles[h.conversationId] ? (
                      <Link href={`${home}/${h.conversationId}`} className="hover:text-foreground hover:underline">
                        {titles[h.conversationId]}
                      </Link>
                    ) : (
                      "hội thoại đã xóa"
                    )
                  }
                  actions={
                    <form action={deleteHighlight}>
                      <input type="hidden" name="highlightId" value={h.id} />
                      <button
                        type="submit"
                        aria-label="Xóa highlight"
                        className="inline-flex size-6 items-center justify-center rounded text-subtle hover:bg-hover hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </form>
                  }
                />
              </li>
            ))}
          </ul>
          {highlights.length === 0 ? (
            <p className="mt-6 rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-subtle">
              Chưa có highlight. Trong một hội thoại, bôi đen đoạn bạn thấy đáng bàn rồi bấm Highlight.
            </p>
          ) : null}
        </div>
      </PageBody>
    </PageLayout>
  );
}
