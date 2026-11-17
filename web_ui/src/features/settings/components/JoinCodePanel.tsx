// Shows the current join code with copy and, for the owner, rotate controls.
import { CopyButton } from "@/components/CopyButton";
import { JoinCodeDisplay, UpdateJoinCodeButton } from "@/features/join";
import { format, t } from "@/lib/i18n";
import type { JoinCode } from "@/types/join";

export function JoinCodePanel({
  workspaceId,
  joinCode,
  isOwner,
}: {
  workspaceId: string;
  joinCode: JoinCode | null;
  isOwner: boolean;
}) {
  return (
    <div className="grid gap-3">
      {joinCode ? (
        <div className="flex flex-wrap items-center gap-3">
          <JoinCodeDisplay code={joinCode.code} />
          <CopyButton
            text={joinCode.code}
            label={t.settings.copyCode}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-[13px] font-medium text-foreground hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
          {isOwner ? <UpdateJoinCodeButton workspaceId={workspaceId} label={t.join.regenerate} /> : null}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-subtle">{t.settings.noJoinCode}</p>
          {isOwner ? <UpdateJoinCodeButton workspaceId={workspaceId} label={t.join.createCode} /> : null}
        </div>
      )}
      {joinCode?.createdAt ? (
        <p className="text-xs text-subtle">{format(t.join.createdAt, { time: joinCode.createdAt })}</p>
      ) : null}
    </div>
  );
}
