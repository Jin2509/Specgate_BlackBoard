// Lists the private highlights kept from conversations with the agent; only from here does anything reach a team.
import { Highlighter } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { PageBody } from "@/components/PageBody";
import { PageHeader } from "@/components/PageHeader";
import { PageLayout } from "@/components/PageLayout";
import { requireMe } from "@/features/auth/server";
import { PrivateHighlightsView, type SendTarget } from "@/features/personal";
import { listConversations, listPrivateHighlights } from "@/features/personal/server";
import { ContentSkeleton } from "@/features/workspace";
import { getWorkspace, requirePersonalWorkspace } from "@/features/workspace/server";
import { format, t } from "@/lib/i18n";
import { toDayClock } from "@/utils/date-format";
import { toPersonalHomePath } from "@/utils/route-paths";

export const metadata: Metadata = { title: t.personal.privateHighlights };

export default function PrivateHighlightsPage(props: PageProps<"/w/[workspaceId]/chat/highlights">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <PrivateHighlightsContent {...props} />
    </Suspense>
  );
}

async function PrivateHighlightsContent({ params, searchParams }: PageProps<"/w/[workspaceId]/chat/highlights">) {
  const workspace = await requirePersonalWorkspace(params);
  const me = await requireMe();
  const query = await searchParams;
  const [list, conversations, sharedWorkspaces] = await Promise.all([
    listPrivateHighlights(),
    listConversations(),
    Promise.all(me.workspaces.map((shared) => getWorkspace(shared.id).catch(() => null))),
  ]);
  const targets: SendTarget[] = sharedWorkspaces.flatMap((shared) =>
    shared && shared.channels
      ? [{ id: shared.id, name: shared.name, myName: shared.myName ?? me.user.displayName, channels: shared.channels }]
      : [],
  );

  return (
    <PageLayout>
      <PageHeader
        icon={<Highlighter />}
        title={t.personal.privateHighlights}
        meta={format(t.personal.privateMeta, { total: list.total, limit: list.limit })}
      />
      <PageBody>
        <PrivateHighlightsView
          home={toPersonalHomePath(workspace.id)}
          list={{
            ...list,
            items: list.items.map((highlight) => ({
              ...highlight,
              createdAtLabel: toDayClock(highlight.createdAt),
              sends: highlight.sends.map((send) => ({ ...send, atLabel: toDayClock(send.at) })),
            })),
          }}
          conversations={conversations.map((conversation) => ({ id: conversation.id, title: conversation.title }))}
          targets={targets}
          initialKind={typeof query.kind === "string" ? query.kind : undefined}
        />
      </PageBody>
    </PageLayout>
  );
}
