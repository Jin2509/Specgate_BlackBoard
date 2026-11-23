// Explains who assigns tasks on this board, and what the owner does when nobody else has joined yet.
import { Info, UserPlus } from "lucide-react";
import Link from "next/link";

import { format, t } from "@/lib/i18n";

export function TaskAssignHint({
  isOwner,
  memberCount,
  joinCode,
  requestsHref,
}: {
  isOwner: boolean;
  memberCount: number;
  joinCode: string | null;
  requestsHref: string;
}) {
  if (isOwner && memberCount <= 1) {
    return (
      <p role="status" className="mb-4 flex items-start gap-2 rounded-lg bg-proposed-soft px-3.5 py-2.5 text-sm text-foreground">
        <UserPlus className="mt-0.5 size-4 shrink-0 text-proposed" />
        <span>
          {joinCode ? format(t.tasks.aloneHintWithCode, { code: joinCode }) : t.tasks.aloneHint}{" "}
          <Link href={requestsHref} className="font-medium text-primary-strong hover:underline">
            {t.tasks.openRequests}
          </Link>
        </span>
      </p>
    );
  }
  return (
    <p className="mb-4 flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0 text-subtle" />
      {isOwner ? t.tasks.ownerHint : t.tasks.memberHint}
    </p>
  );
}
