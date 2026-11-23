"use client";
// Summarizes the user's old messages on click only, after saying how many messages, blocks and agent calls it takes.
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { format, t } from "@/lib/i18n";
import { showErrorToast } from "@/stores/toast-store";
import type { AgentContext } from "@/types/highlight";

import { createOldMessagesDigest } from "../api/conversation-actions";

function toPlanParts(plan: NonNullable<AgentContext["digestPlan"]>): string {
  const parts = [
    plan.summarizedBlocks > 0
      ? format(t.personal.digestPlanSummarized, { count: plan.summarizedBlocks })
      : t.personal.digestPlanNoCall,
    plan.verbatimMessages > 0 ? format(t.personal.digestPlanVerbatim, { count: plan.verbatimMessages }) : null,
  ];
  return parts.filter(Boolean).join("; ");
}

export function DigestButton({
  conversationId,
  plan,
}: {
  conversationId: string;
  plan: NonNullable<AgentContext["digestPlan"]>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <div className="mt-1.5">
      <p className="text-xs text-subtle">
        {format(t.personal.digestPlan, { messages: plan.messages, blocks: plan.blocks, parts: toPlanParts(plan) })}
      </p>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const outcome = await createOldMessagesDigest(conversationId);
            if (!outcome.ok) return showErrorToast(outcome.error);
            router.refresh();
          })
        }
        className="mt-1.5 inline-flex h-7 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-foreground hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
      >
        {isPending ? <LoaderCircle className="size-3.5 animate-spin" /> : null} {t.personal.summarizeOld}
      </button>
    </div>
  );
}
