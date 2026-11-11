// Trang thành viên, đề bài và cấu hình agent (màn 11).
import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { PageBody, PageHeader, PageLayout } from "@/components/common/page-header";
import { AgentSettings } from "@/features/settings/agent-settings";
import { BriefEditor } from "@/features/settings/brief-editor";
import { InviteList } from "@/features/settings/invite-list";
import { MemberList } from "@/features/settings/member-list";
import { getAgents, getInvites, getProfile } from "@/lib/mock/queries";
import { requireWorkspace, workspaceStaticParams } from "@/lib/workspace-route";

export const generateStaticParams = workspaceStaticParams;
export const metadata: Metadata = { title: "Thành viên và agent" };

export default async function SettingsPage({ params }: PageProps<"/w/[ws]/settings">) {
  const ws = await requireWorkspace(params);
  const agents = getAgents(ws);
  const members = ws.members.map((m) => ({ profile: getProfile(m.userId), role: m.role }));

  return (
    <PageLayout>
      <PageHeader icon={<Settings />} title="Thành viên và agent" meta={`${ws.members.length} người · ${agents.length} agent`} />
      <PageBody className="grid content-start items-start gap-4 @3xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-4">
          <MemberList members={members} />
          <BriefEditor brief={ws.brief} />
          {ws.kind === "shared" ? (
            <InviteList invites={getInvites(ws.id)} creatorName={(id) => getProfile(id)?.displayName} />
          ) : null}
        </div>
        <AgentSettings initialAgents={agents} editId={agents.find((a) => a.role === "critic")?.id} />
      </PageBody>
    </PageLayout>
  );
}
