// Trang thành viên, đề bài, mã tham gia và agent riêng của từng thành viên (màn 11).
import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { PageBody, PageHeader, PageLayout } from "@/components/common/page-header";
import { BriefEditor } from "@/features/settings/brief-editor";
import { JoinCodePanel } from "@/features/settings/join-code-panel";
import { MemberList } from "@/features/settings/member-list";
import { getJoinCode, getProfile, getTeam, isOwner } from "@/lib/mock/queries";
import { requireSession } from "@/lib/session";
import { requireSharedWorkspace, workspaceStaticParams } from "@/lib/workspace-route";

export const generateStaticParams = workspaceStaticParams;
export const metadata: Metadata = { title: "Thành viên và agent" };

export default async function SettingsPage({ params }: PageProps<"/w/[ws]/settings">) {
  const ws = await requireSharedWorkspace(params);
  const { user } = await requireSession();
  const joinCode = getJoinCode(ws.id);
  const team = getTeam(ws);

  return (
    <PageLayout>
      <PageHeader
        icon={<Settings />}
        title="Thành viên và agent"
        meta={`${team.length} người · ${team.filter((m) => m.agent).length} agent riêng`}
      />
      <PageBody className="grid grid-cols-1 content-start items-start gap-4 @3xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-4">
          <BriefEditor brief={ws.brief} />
          <JoinCodePanel
            workspaceId={ws.id}
            joinCode={joinCode}
            creatorName={getProfile(joinCode?.createdBy)?.displayName}
            isOwner={isOwner(ws, user.id)}
          />
        </div>
        <MemberList team={team} viewerId={user.id} />
      </PageBody>
    </PageLayout>
  );
}
