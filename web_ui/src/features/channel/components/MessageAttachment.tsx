// Renders what follows a message: board receipt, command list, brief link, channel summary tag or posted file.
import { FileText, ListCollapse, Pin } from "lucide-react";
import Link from "next/link";

import { format, t } from "@/lib/i18n";
import type { Attachment } from "@/types/message";
import { IDEA_STATUS_META } from "@/utils/status-meta";

import { DocumentAttachmentCard } from "./DocumentAttachmentCard";

export function MessageAttachment({ attachment, workspaceId }: { attachment: Attachment; workspaceId: string }) {
  switch (attachment.type) {
    case "board-receipt": {
      const where = attachment.status
        ? format(t.channel.receiptColumn, { status: IDEA_STATUS_META[attachment.status].label.toLowerCase() })
        : t.channel.receiptNotes;
      return (
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-subtle">
          <Pin className="size-3.5" /> {format(t.channel.receiptAt, { number: attachment.number })}{" "}
          <Link href={`/w/${workspaceId}/board`} className="font-medium text-muted-foreground hover:underline">
            {where}
          </Link>
        </p>
      );
    }
    case "help":
      return (
        <dl className="mt-1.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-[13px]">
          {attachment.commands.map((command) => (
            <div key={command.usage} className="contents">
              <dt className="font-mono text-[12px] text-sidebar-accent-foreground">{command.usage}</dt>
              <dd className="text-muted-foreground">{command.description}</dd>
            </div>
          ))}
        </dl>
      );
    case "brief":
      return (
        <Link
          href={`/w/${workspaceId}/brief`}
          className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary-strong hover:underline"
        >
          <FileText className="size-3.5" /> {t.channel.openBrief}
        </Link>
      );
    case "document":
      return (
        <DocumentAttachmentCard
          fileName={attachment.fileName}
          sizeBytes={attachment.sizeBytes}
          charCount={attachment.charCount}
          markdown={attachment.markdown}
          isTruncated={attachment.truncated}
        />
      );
    case "summary":
      return (
        <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-subtle">
          <ListCollapse className="size-3.5" /> {t.channel.channelSummaryNote}
        </p>
      );
  }
}
