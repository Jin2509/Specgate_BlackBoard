// Shows the workspace name and visibility, brief, join code, members and each member's personal agent.
import { Settings } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { PageBody } from "@/components/PageBody";
import { PageHeader } from "@/components/PageHeader";
import { PageLayout } from "@/components/PageLayout";
import { SettingsSection } from "@/components/SettingsSection";
import { requireMe } from "@/features/auth/server";
import { BriefEditor, JoinCodePanel, MemberList, WorkspaceDetailsForm } from "@/features/settings";
import { ContentSkeleton, isOwner } from "@/features/workspace";
import { requireSharedWorkspace } from "@/features/workspace/server";
import { format, t } from "@/lib/i18n";
import { toContentWidthClassName } from "@/utils/content-width";
import { toDayClock } from "@/utils/date-format";

export const metadata: Metadata = { title: t.settings.pageTitle };

export default function SettingsPage(props: PageProps<"/w/[workspaceId]/settings">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <SettingsPageContent {...props} />
    </Suspense>
  );
}

async function SettingsPageContent({ params }: PageProps<"/w/[workspaceId]/settings">) {
  const [workspace, me] = await Promise.all([requireSharedWorkspace(params), requireMe()]);
  const isViewerOwner = isOwner(workspace);
  const team = workspace.members;

  return (
    <PageLayout>
      <PageHeader
        icon={<Settings />}
        title={t.settings.pageTitle}
        meta={format(t.settings.pageMeta, {
          people: team.length,
          agents: team.filter((member) => member.agent).length,
        })}
      />
      <PageBody>
        <div className={toContentWidthClassName("wide")}>
          {isViewerOwner ? (
            <SettingsSection title={t.settings.workspaceTitle} description={t.settings.workspaceDescription}>
              <WorkspaceDetailsForm workspaceId={workspace.id} name={workspace.name} visibility={workspace.visibility} />
            </SettingsSection>
          ) : null}
          <SettingsSection title={t.settings.brief} description={t.settings.briefDescription}>
            <BriefEditor workspaceId={workspace.id} brief={workspace.brief} canEdit={isViewerOwner} />
          </SettingsSection>
          <SettingsSection title={t.settings.joinCode} description={t.settings.joinCodeDescription}>
            <JoinCodePanel
              workspaceId={workspace.id}
              joinCode={workspace.joinCode ? { code: workspace.joinCode, createdAt: toDayClock(workspace.joinCodeAt) } : null}
              isOwner={isViewerOwner}
            />
          </SettingsSection>
          <SettingsSection title={t.settings.teamTitle} description={t.settings.teamDescription}>
            <MemberList team={team} viewerId={me.user.id} workspaceId={workspace.id} isViewerOwner={isViewerOwner} />
          </SettingsSection>
        </div>
      </PageBody>
    </PageLayout>
  );
}
