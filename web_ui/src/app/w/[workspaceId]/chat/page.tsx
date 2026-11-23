// Opens a new private conversation, or sends the user to the key page when no API key is set yet.
import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { PageHeader } from "@/components/PageHeader";
import { PageLayout } from "@/components/PageLayout";
import { requireMe } from "@/features/auth/server";
import { ChatScreen } from "@/features/personal";
import { ContentSkeleton } from "@/features/workspace";
import { requirePersonalWorkspace } from "@/features/workspace/server";
import { t } from "@/lib/i18n";
import { toPersonalHomePath } from "@/utils/route-paths";

export const metadata: Metadata = { title: t.personal.sidebarTitle };

export default function NewChatPage(props: PageProps<"/w/[workspaceId]/chat">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <NewChatPageContent {...props} />
    </Suspense>
  );
}

async function NewChatPageContent({ params }: PageProps<"/w/[workspaceId]/chat">) {
  const [workspace, me] = await Promise.all([requirePersonalWorkspace(params), requireMe()]);
  const home = toPersonalHomePath(workspace.id);
  if (!me.key) redirect(`${home}/key`);

  return (
    <PageLayout>
      <PageHeader icon={<MessageSquare />} title={t.personal.newConversation} meta={t.personal.onlyYouSee} />
      <ChatScreen
        home={home}
        turns={[]}
        model={me.key.model}
        linkOptions={me.workspaces.map((shared) => ({ id: shared.id, name: shared.name }))}
      />
    </PageLayout>
  );
}
