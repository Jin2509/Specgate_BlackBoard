"use client";
// Reviews and sends private highlights to a channel as one message under the user's name, one quote card per item.
import { LoaderCircle, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { format, t } from "@/lib/i18n";
import { cn } from "@/utils/cn";

import { createHighlightSend } from "../api/private-highlight-actions";
import {
  FILTER_INPUT_CLASS_NAME,
  isAgentTextEdited,
  type PrivateHighlightItem,
  type SendTarget,
} from "../utils/private-highlight-item";

export function SendHighlightsDialog({
  items,
  targets,
  onClose,
  onSent,
}: {
  items: PrivateHighlightItem[] | null;
  targets: SendTarget[];
  onClose: () => void;
  onSent: () => void;
}) {
  return (
    <Dialog open={items !== null} onOpenChange={(isOpen) => (isOpen ? null : onClose())}>
      <DialogContent className="sm:max-w-xl">
        {items ? (
          <SendForm key={items.map((item) => item.id).join()} items={items} targets={targets} onClose={onClose} onSent={onSent} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function toCardHeading(item: PrivateHighlightItem, myName: string, text: string): string {
  const speaker =
    item.speakerKind === "agent"
      ? format(t.channel.agentOf, { agent: item.speaker.split(t.channel.ownerSeparator)[0], name: myName })
      : myName;
  const heading =
    item.kind === "summary"
      ? format(t.privateHighlights.summaryOf, { name: myName, speaker })
      : format(t.channel.says, { speaker });
  return isAgentTextEdited(item, text) ? `${heading}${format(t.channel.editedSuffix, { name: myName })}` : heading;
}

function SendForm({
  items,
  targets,
  onClose,
  onSent,
}: {
  items: PrivateHighlightItem[];
  targets: SendTarget[];
  onClose: () => void;
  onSent: () => void;
}) {
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState(targets[0]?.id ?? "");
  const target = targets.find((candidate) => candidate.id === workspaceId);
  const [channelId, setChannelId] = useState(target?.channels[0]?.id ?? "");
  const [textsById, setTextsById] = useState<Record<string, string>>(
    Object.fromEntries(items.map((item) => [item.id, item.text])),
  );
  const [ownWords, setOwnWords] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<{ workspaceId: string; channelName: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const myName = target?.myName ?? t.privateHighlights.fallbackName;
  const channel = target?.channels.find((candidate) => candidate.id === channelId);
  const alreadySentHere = items.filter((item) => item.sends.some((send) => send.channelId === channelId));

  function handleSend(isConfirmed: boolean) {
    startTransition(async () => {
      const overrides = Object.fromEntries(
        items.filter((item) => textsById[item.id] !== item.text).map((item) => [item.id, textsById[item.id]]),
      );
      const outcome = await createHighlightSend({
        ids: items.map((item) => item.id),
        workspaceId,
        channelId,
        text: ownWords,
        overrides,
        confirm: isConfirmed,
      });
      if (!outcome.ok) {
        if (outcome.code === "ALREADY_SENT") return setDuplicateNotice(outcome.error);
        return setError(outcome.error);
      }
      setSentTo({ workspaceId, channelName: channel?.name ?? channelId });
      onSent();
      router.refresh();
    });
  }

  if (sentTo)
    return (
      <>
        <DialogHeader>
          <DialogTitle>{format(t.privateHighlights.sentToChannel, { channel: sentTo.channelName })}</DialogTitle>
          <DialogDescription>{t.privateHighlights.snapshotNote}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            {t.common.close}
          </Button>
          <Button asChild>
            <Link href={`/w/${sentTo.workspaceId}/c/${sentTo.channelName}`}>{t.privateHighlights.openChannel}</Link>
          </Button>
        </DialogFooter>
      </>
    );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t.privateHighlights.sendToTeam}</DialogTitle>
        <DialogDescription>{format(t.privateHighlights.sendDescription, { name: myName })}</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-[13px] font-medium text-muted-foreground">
          {t.privateHighlights.sharedWorkspace}
          <Select
            aria-label={t.privateHighlights.sharedWorkspace}
            size="lg"
            value={workspaceId}
            onValueChange={(nextWorkspaceId) => {
              setWorkspaceId(nextWorkspaceId);
              setChannelId(targets.find((candidate) => candidate.id === nextWorkspaceId)?.channels[0]?.id ?? "");
            }}
            options={targets.map((candidate) => ({ value: candidate.id, label: candidate.name }))}
          />
        </label>
        <label className="grid gap-1 text-[13px] font-medium text-muted-foreground">
          {t.privateHighlights.channel}
          <Select
            aria-label={t.privateHighlights.channel}
            size="lg"
            value={channelId}
            onValueChange={setChannelId}
            options={(target?.channels ?? []).map((candidate) => ({ value: candidate.id, label: `#${candidate.name}` }))}
          />
        </label>
      </div>
      <label className="grid gap-1 text-[13px] font-medium text-muted-foreground">
        {t.privateHighlights.ownWords}
        <input
          value={ownWords}
          onChange={(event) => setOwnWords(event.target.value)}
          placeholder={t.privateHighlights.ownWordsPlaceholder}
          className={cn(FILTER_INPUT_CLASS_NAME, "h-9")}
        />
      </label>
      <ul className="max-h-[45vh] space-y-3 overflow-y-auto">
        {items.map((item) => (
          <li key={item.id} className="rounded-md border-l-[3px] border-agent-line bg-muted p-2">
            <p className="mb-1 text-xs font-medium text-agent">{toCardHeading(item, myName, textsById[item.id] ?? "")}</p>
            <Textarea
              aria-label={t.privateHighlights.sendContent}
              rows={item.kind === "passage" ? 3 : 6}
              value={textsById[item.id]}
              onChange={(event) => setTextsById((current) => ({ ...current, [item.id]: event.target.value }))}
            />
          </li>
        ))}
      </ul>
      {alreadySentHere.length && !duplicateNotice ? (
        <p className="text-xs text-proposed">
          {alreadySentHere.length === 1
            ? format(t.privateHighlights.alreadySentOne, { channel: channel?.name ?? "" })
            : format(t.privateHighlights.alreadySentMany, { count: alreadySentHere.length, channel: channel?.name ?? "" })}
        </p>
      ) : null}
      {duplicateNotice ? <p className="text-sm text-proposed">{duplicateNotice}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {t.common.cancel}
        </Button>
        <Button disabled={isPending || !channelId} onClick={() => handleSend(Boolean(duplicateNotice))}>
          {isPending ? <LoaderCircle className="animate-spin" /> : <Send />}{" "}
          {duplicateNotice ? t.privateHighlights.sendAgain : t.privateHighlights.send}
        </Button>
      </DialogFooter>
    </>
  );
}
