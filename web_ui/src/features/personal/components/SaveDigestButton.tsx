"use client";
// Saves "my old messages digest" as a private highlight so the user can choose to share it; the agent sends nothing.
import Link from "next/link";
import { useState, useTransition } from "react";

import { t } from "@/lib/i18n";

import { createDigestHighlight } from "../api/private-highlight-actions";

export function SaveDigestButton({ workspaceId, home }: { workspaceId: string; home: string }) {
  const [isPending, startTransition] = useTransition();
  const [resultText, setResultText] = useState<string | null>(null);
  if (resultText)
    return (
      <p className="mt-1.5 text-xs text-muted-foreground">
        {resultText}{" "}
        <Link href={`${home}/highlights`} className="text-primary-strong hover:underline">
          {t.personal.openList}
        </Link>
      </p>
    );
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const outcome = await createDigestHighlight(workspaceId);
          setResultText(outcome.ok ? t.personal.savedToPrivate : outcome.error);
        })
      }
      className="mt-1.5 text-xs font-medium text-primary-strong hover:underline disabled:opacity-50"
    >
      {t.personal.saveDigestToShare}
    </button>
  );
}
