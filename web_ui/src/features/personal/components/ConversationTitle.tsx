"use client";
// Shows the conversation title with an inline rename form.
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";

import { updateConversationTitle } from "../api/conversation-actions";
import { ICON_BUTTON_CLASS_NAME } from "../utils/icon-button-class";

const TITLE_MAX_LENGTH = 80;

export function ConversationTitle({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [isPending, startTransition] = useTransition();
  if (!isEditing)
    return (
      <span className="group/title inline-flex min-w-0 items-center gap-1">
        <span className="truncate">{title}</span>
        <button
          type="button"
          aria-label={t.personal.renameConversation}
          onClick={() => setIsEditing(true)}
          className={ICON_BUTTON_CLASS_NAME}
        >
          <Pencil className="size-3.5" />
        </button>
      </span>
    );
  return (
    <form
      className="inline-flex items-center gap-1"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const nextTitle = value.trim();
          if (nextTitle && nextTitle !== title) await updateConversationTitle(id, nextTitle);
          setIsEditing(false);
          router.refresh();
        });
      }}
    >
      <input
        autoFocus
        aria-label={t.personal.conversationName}
        value={value}
        maxLength={TITLE_MAX_LENGTH}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => (event.key === "Escape" ? setIsEditing(false) : null)}
        className="h-8 w-56 rounded-md border border-border bg-input px-2 text-[0.875rem] font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button size="sm" type="submit" disabled={isPending}>
        {t.common.save}
      </Button>
    </form>
  );
}
