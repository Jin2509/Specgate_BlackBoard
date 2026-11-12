// Một hội thoại của workspace riêng: các lượt hỏi đáp, đoạn đã highlight được tô vệt phấn.
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MessageSquare, Trash2 } from "lucide-react";
import { PageHeader, PageLayout } from "@/components/common/page-header";
import { ChatScreen } from "@/features/personal/chat-screen";
import { getConversation, getHighlights, getProviderKey } from "@/lib/mock/queries";
import { personalHome } from "@/lib/paths";
import { removeConversation } from "@/lib/private-actions";
import { requireSession } from "@/lib/session";
import { requirePersonalWorkspace } from "@/lib/workspace-route";

export const metadata: Metadata = { title: "Workspace riêng" };

export default async function ConversationPage({ params }: PageProps<"/w/[ws]/chat/[conv]">) {
  const ws = await requirePersonalWorkspace(params);
  const { conv: convId } = await params;
  const { user } = await requireSession();
  const home = personalHome(ws.id);
  const key = getProviderKey(user.id);
  if (!key) redirect(`${home}/key`);
  const conv = getConversation(convId, user.id);
  if (!conv) notFound();

  const marks: Record<string, string[]> = {};
  for (const h of getHighlights(user.id).filter((x) => x.conversationId === conv.id)) {
    (marks[h.turnId] ??= []).push(h.text);
  }

  return (
    <PageLayout>
      <PageHeader
        icon={<MessageSquare />}
        title={conv.title}
        meta="Chỉ mình bạn thấy"
        actions={
          <form action={removeConversation}>
            <input type="hidden" name="conversationId" value={conv.id} />
            <button
              type="submit"
              aria-label="Xóa hội thoại"
              title="Xóa hội thoại (highlight đã lưu vẫn còn)"
              className="inline-flex size-8 items-center justify-center rounded text-subtle hover:bg-hover hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Trash2 className="size-4.5" />
            </button>
          </form>
        }
      />
      <ChatScreen
        key={conv.id}
        conversationId={conv.id}
        turns={conv.turns}
        marks={marks}
        model={key.model}
        highlightsHref={`${home}/highlights`}
      />
    </PageLayout>
  );
}
