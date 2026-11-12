// Danh sách highlight của tôi: những đoạn tôi bôi đen trong tin của người khác ở kênh chung.
// Agent riêng của tôi đọc các đoạn này (kèm người nói) khi hội thoại gắn với workspace chung tương ứng.
import type { Metadata } from "next";
import Link from "next/link";
import { Hash, Highlighter, Trash2 } from "lucide-react";
import { PageBody, PageHeader, PageLayout } from "@/components/common/page-header";
import { HighlightQuote } from "@/features/highlight/highlight-quote";
import { getHighlights, getRail, getWorkspace, highlightAuthorLabel } from "@/lib/mock/queries";
import { sharedHome } from "@/lib/paths";
import { deleteHighlight } from "@/lib/private-actions";
import { requireSession } from "@/lib/session";
import { requirePersonalWorkspace } from "@/lib/workspace-route";

export const metadata: Metadata = { title: "Highlight của tôi" };

export default async function HighlightsPage({ params }: PageProps<"/w/[ws]/chat/highlights">) {
  await requirePersonalWorkspace(params);
  const { user } = await requireSession();
  const shared = getRail(user.id).filter((w) => w.kind === "shared");
  const groups = shared.map((ws) => ({ ws, items: getHighlights(user.id, ws.id) })).filter((g) => g.items.length > 0);
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <PageLayout>
      <PageHeader icon={<Highlighter />} title="Highlight của tôi" meta={`${total} đoạn`} />
      <PageBody>
        <div className="mx-auto max-w-2xl">
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Đây là những đoạn bạn bôi đen trong tin của người khác ở kênh chung. Agent ở workspace riêng của bạn đọc các đoạn này,
            biết ai đã nói, và coi chúng là ý chưa chốt. Tin của chính bạn thì agent tự đọc, không cần highlight. Chỉ mình bạn
            thấy danh sách này.
          </p>

          {groups.map(({ ws, items }) => (
            <section key={ws.id} className="mt-6">
              <h2 className="text-[13px] font-semibold text-subtle">
                <Link href={sharedHome(ws.id)} className="hover:text-foreground hover:underline">
                  {ws.name}
                </Link>
              </h2>
              <ul className="mt-2 space-y-3">
                {items.map((h) => {
                  const channel = getWorkspace(h.workspaceId)?.channels.find((c) => c.id === h.channelId);
                  return (
                    <li key={h.id}>
                      <HighlightQuote
                        className="max-w-none"
                        text={h.text}
                        label={h.label}
                        byline={
                          <>
                            <span className="font-medium text-muted-foreground">{highlightAuthorLabel(h)}</span> nói ·{" "}
                            <Link href={`/w/${ws.id}/c/${h.channelId}`} className="inline-flex items-center hover:underline">
                              <Hash className="size-3" />
                              {channel?.name ?? h.channelId}
                            </Link>{" "}
                            · {h.at}
                          </>
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
                  );
                })}
              </ul>
            </section>
          ))}

          {total === 0 ? (
            <p className="mt-6 rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-subtle">
              Chưa có highlight. Trong kênh của một workspace chung, bôi đen đoạn bạn muốn agent của mình đọc rồi bấm Highlight.
            </p>
          ) : null}
        </div>
      </PageBody>
    </PageLayout>
  );
}
