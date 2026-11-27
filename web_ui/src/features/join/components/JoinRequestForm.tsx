"use client";
// Asks to join a shared workspace from Explore, with a note for the owner.
import { Clock, LoaderCircle, SendHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { format, t } from "@/lib/i18n";
import type { ExploreCard } from "@/types/join";
import { toSharedHomePath } from "@/utils/route-paths";

import { createJoinRequest } from "../api/join-actions";

export function JoinRequestForm({ target }: { target: ExploreCard }) {
  // Prefilled like a chat app's friend request: the owner gets a polite note even when the user changes nothing.
  const [message, setMessage] = useState(
    target.relation === "pending" ? "" : format(t.join.defaultMessage, { owner: target.ownerName, name: target.name }),
  );

  if (target.relation === "member") {
    return (
      <section className="rounded-lg bg-card p-4">
        <h2 className="font-semibold text-sidebar-accent-foreground">{format(t.join.alreadyIn, { name: target.name })}</h2>
        <Button asChild className="mt-3">
          <Link href={toSharedHomePath(target.id)}>{t.join.openWorkspace}</Link>
        </Button>
      </section>
    );
  }

  return (
    <form action={createJoinRequest} className="flex min-h-0 flex-col self-start rounded-lg bg-card p-4">
      <input type="hidden" name="workspaceId" value={target.id} />
      <h2 className="text-lg font-semibold text-sidebar-accent-foreground">{format(t.join.askToJoin, { name: target.name })}</h2>
      <p className="mt-1 text-[0.84375rem] leading-relaxed text-muted-foreground">{target.brief}</p>
      <p className="mt-1 text-xs text-subtle">{format(t.join.ownerLine, { name: target.ownerName })}</p>
      {target.relation === "pending" && target.pendingRequestId ? (
        <Link
          href={`/join/${target.pendingRequestId}`}
          className="mt-3 flex items-center gap-2 rounded-md bg-proposed-soft px-3 py-2 text-[0.8125rem] text-foreground hover:underline"
        >
          <Clock className="size-4 text-proposed" /> {t.join.pendingLink}
        </Link>
      ) : null}

      <div className="mt-4 grid gap-1.5">
        <Label htmlFor="join-message" className="text-[0.8125rem] font-semibold text-muted-foreground">
          {t.join.messageLabel}
        </Label>
        <Textarea
          id="join-message"
          name="message"
          rows={3}
          value={message}
          placeholder={t.join.messagePlaceholder}
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-subtle">{t.join.requestHint}</p>
      <div className="mt-4 flex justify-end">
        <SubmitButton label={target.relation === "pending" ? t.join.updateMessage : t.join.sendRequest} />
      </div>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending: isPending } = useFormStatus();
  return (
    <Button type="submit" disabled={isPending}>
      {isPending ? <LoaderCircle className="animate-spin" /> : <SendHorizontal />} {label}
    </Button>
  );
}
