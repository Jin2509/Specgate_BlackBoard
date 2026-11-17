// Shows one private conversation; the agent context panel appears only when it is linked to a shared workspace.
import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { CollapsibleSidebar } from "@/components/CollapsibleSidebar";
import { PageHeader } from "@/components/PageHeader";
import { PageLayout } from "@/components/PageLayout";
import { requireMe } from "@/features/auth/server";
import { AgentContextPanel, ChatScreen, ContextPicker, ConversationActions, ConversationTitle } from "@/features/personal";
import { getAgentContext, getConversation } from "@/features/personal/server";
import { ContentSkeleton } from "@/features/workspace";
import { requirePersonalWorkspace } from "@/features/workspace/server";
import { isApiError } from "@/lib/api/http-client";
import { t } from "@/lib/i18n";
import { toClock } from "@/utils/date-format";
import { toPersonalHomePath } from "@/utils/route-paths";

const NOT_FOUND_STATUS = 404;

export const metadata: Metadata = { title: t.personal.sidebarTitle };

export default function ConversationPage(props: PageProps<"/w/[workspaceId]/chat/[conversationId]">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ConversationPageContent {...props} />
    </Suspense>
  );
}

async function ConversationPageContent({ params }: PageProps<"/w/[workspaceId]/chat/[conversationId]">) {
  const workspace = await requirePersonalWorkspace(params);
  const { conversationId } = await params;
  const me = await requireMe();
  const home = toPersonalHomePath(workspace.id);
  if (!me.key) redirect(`${home}/key`);
  let conversation;
  try {
    conversation = await getConversation(conversationId);
  } catch (error) {
    if (isApiError(error, NOT_FOUND_STATUS)) notFound();
    throw error;
  }
  const options = me.workspaces.map((shared) => ({ id: shared.id, name: shared.name }));
  const context = conversation.workspaceId ? (await getAgentContext(conversation.id)).context : null;
  const linkName = conversation.workspace?.isMember ? conversation.workspace.name : undefined;

  return (
    <div className="flex min-w-0 flex-1">
      <PageLayout>
        <PageHeader
          icon={<MessageSquare />}
          title={<ConversationTitle id={conversation.id} title={conversation.title} />}
          actions={
            <>
              {options.length > 0 ? (
                <ContextPicker conversationId={conversation.id} value={conversation.workspaceId ?? undefined} options={options} />
              ) : null}
              <ConversationActions
                id={conversation.id}
                home={home}
                highlightCount={conversation.highlightCount}
                hasAnswer={conversation.turns.some((turn) => turn.role === "assistant" && !turn.error)}
              />
            </>
          }
        />
        <ChatScreen
          key={conversation.id}
          home={home}
          conversationId={conversation.id}
          turns={conversation.turns.map((turn) => ({ ...turn, at: toClock(turn.at) }))}
          model={me.key.model}
          linkName={linkName}
          marks={conversation.highlights}
        />
      </PageLayout>
      {context ? (
        <CollapsibleSidebar
          id="agent-context"
          side="right"
          breakpoint="xl"
          label={t.personal.contextSidebar}
          widthClassName="w-80"
        >
          <AgentContextPanel context={context} userId={me.user.id} home={home} conversationId={conversation.id} />
        </CollapsibleSidebar>
      ) : null}
    </div>
  );
}
