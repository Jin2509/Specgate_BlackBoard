// Một hội thoại của workspace riêng, có khung "Agent đang đọc" khi hội thoại gắn với một workspace chung.
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MessageSquare, Trash2 } from "lucide-react";
import { CollapsibleSidebar } from "@/components/common/collapsible-sidebar";
import { PageHeader, PageLayout } from "@/components/common/page-header";
import { AgentContextPanel } from "@/features/personal/agent-context-panel";
import { ChatScreen } from "@/features/personal/chat-screen";
import { ContextPicker } from "@/features/personal/context-picker";
import { getAgentContext, getConversation, getProviderKey, getRail } from "@/lib/mock/queries";
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

  const options = getRail(user.id)
    .filter((w) => w.kind === "shared")
    .map((w) => ({ id: w.id, name: w.name }));
  const ctx = conv.workspaceId ? getAgentContext(user.id, conv.workspaceId) : undefined;

  return (
    <div className="flex min-w-0 flex-1">
      <PageLayout>
        <PageHeader
          icon={<MessageSquare />}
          title={conv.title}
          meta="Chỉ mình bạn thấy"
          actions={
            <>
              {options.length > 0 ? <ContextPicker conversationId={conv.id} value={ctx?.ws.id} options={options} /> : null}
              <form action={removeConversation}>
                <input type="hidden" name="conversationId" value={conv.id} />
                <button
                  type="submit"
                  aria-label="Xóa hội thoại"
                  title="Xóa hội thoại (tin đã gửi vào kênh vẫn còn)"
                  className="inline-flex size-8 items-center justify-center rounded text-subtle hover:bg-hover hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Trash2 className="size-4.5" />
                </button>
              </form>
            </>
          }
        />
        <ChatScreen
          key={conv.id}
          conversationId={conv.id}
          turns={conv.turns}
          model={key.model}
          link={ctx ? { workspaceId: ctx.ws.id, workspaceName: ctx.ws.name, channels: ctx.ws.channels } : undefined}
        />
      </PageLayout>
      <CollapsibleSidebar side="right" breakpoint="lg" label="ngữ cảnh agent đang đọc" widthClassName="w-80">
        <AgentContextPanel ctx={ctx} userId={user.id} />
      </CollapsibleSidebar>
    </div>
  );
}
