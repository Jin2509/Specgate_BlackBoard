// Workspace riêng, hội thoại mới. Chưa có key thì chuyển sang màn nhập key.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { PageHeader, PageLayout } from "@/components/common/page-header";
import { ChatScreen } from "@/features/personal/chat-screen";
import { getProviderKey } from "@/lib/mock/queries";
import { personalHome } from "@/lib/paths";
import { requireSession } from "@/lib/session";
import { requirePersonalWorkspace, workspaceStaticParams } from "@/lib/workspace-route";

export const generateStaticParams = workspaceStaticParams;
export const metadata: Metadata = { title: "Workspace riêng" };

export default async function NewChatPage({ params }: PageProps<"/w/[ws]/chat">) {
  const ws = await requirePersonalWorkspace(params);
  const { user } = await requireSession();
  const key = getProviderKey(user.id);
  const home = personalHome(ws.id);
  if (!key) redirect(`${home}/key`);

  return (
    <PageLayout>
      <PageHeader icon={<MessageSquare />} title="Hội thoại mới" meta="Chỉ mình bạn thấy" />
      <ChatScreen turns={[]} marks={{}} model={key.model} highlightsHref={`${home}/highlights`} />
    </PageLayout>
  );
}
