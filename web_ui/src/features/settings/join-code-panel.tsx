// Ô mã tham gia hiện hành của workspace chung ở trang cài đặt; chủ workspace đổi được mã.
import { KeyRound } from "lucide-react";
import { Panel } from "@/components/common/panel";
import { JoinCodeDisplay, RegenerateCodeButton } from "@/features/join/join-code-display";
import type { JoinCode } from "@/lib/types";

export function JoinCodePanel({
  workspaceId,
  joinCode,
  creatorName,
  isOwner,
}: {
  workspaceId: string;
  joinCode: JoinCode | undefined;
  creatorName: string | undefined;
  isOwner: boolean;
}) {
  return (
    <Panel title="Mã tham gia" icon={<KeyRound />}>
      {joinCode ? (
        <div className="grid gap-2">
          <JoinCodeDisplay code={joinCode.code} />
          <p className="text-xs text-subtle">
            {creatorName} tạo lúc {joinCode.createdAt}. Người nhập mã phải chờ chủ workspace duyệt.
          </p>
        </div>
      ) : (
        <p className="text-[13px] text-subtle">Chưa có mã tham gia.</p>
      )}
      {isOwner ? (
        <div className="mt-3">
          <RegenerateCodeButton workspaceId={workspaceId} label={joinCode ? "Đổi mã" : "Tạo mã"} />
        </div>
      ) : null}
    </Panel>
  );
}
