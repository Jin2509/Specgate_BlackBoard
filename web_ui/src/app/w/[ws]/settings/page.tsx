// Trang thành viên, đề bài và cấu hình agent (màn 11).
import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { PageBody, PageHeader, PageLayout } from "@/components/common/page-header";
import { AgentSettings } from "@/features/settings/agent-settings";
import { BriefEditor } from "@/features/settings/brief-editor";
import { JoinCodePanel } from "@/features/settings/join-code-panel";
import { MemberList } from "@/features/settings/member-list";
import { getAgents, getJoinCode, getProfile, isOwner } from "@/lib/mock/queries";
import { requireSession } from "@/lib/session";
import { requireSharedWorkspace, workspaceStaticParams } from "@/lib/workspace-route";

export const generateStaticParams = workspaceStaticParams;
export const metadata: Metadata = { title: "Thành viên và agent" };

export default async function SettingsPage({ params }: PageProps<"/w/[ws]/settings">) {
  const ws = await requireSharedWorkspace(params);
  const { user } = await requireSession();
  const joinCode = getJoinCode(ws.id);
  const agents = getAgents(ws);
  const members = ws.members.map((m) => ({ profile: getProfile(m.userId), role: m.role }));

  return (
    <PageLayout>
      <PageHeader icon={<Settings />} title="Thành viên và agent" meta={`${ws.members.length} người · ${agents.length} agent`} />
      <PageBody className="grid grid-cols-1 content-start items-start gap-4 @3xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-4">
          <MemberList members={members} />
          <BriefEditor brief={ws.brief} />
          {ws.kind === "shared" ? (
            <JoinCodePanel
              workspaceId={ws.id}
              joinCode={joinCode}
              creatorName={getProfile(joinCode?.createdBy)?.displayName}
              isOwner={isOwner(ws, user.id)}
            />
          ) : null}
        </div>
        <AgentSettings initialAgents={agents} editId={agents.find((a) => a.role === "critic")?.id} />
      </PageBody>
    </PageLayout>
  );
}
