"use client";
// Asks to join a shared workspace with a code, then opens the waiting page.
import { KeyRound, LoaderCircle } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";
import { cn } from "@/utils/cn";

import { createJoinRequestByCode, type JoinCodeState } from "../api/join-actions";
import { JOIN_CODE_INPUT_SLACK, JOIN_CODE_LENGTH } from "../utils/join-code";

export function JoinCodeForm({ shouldAutoFocus = false, className }: { shouldAutoFocus?: boolean; className?: string }) {
  const [state, formAction, isPending] = useActionState<JoinCodeState, FormData>(createJoinRequestByCode, {});

  return (
    <form action={formAction} className={cn("grid gap-2", className)}>
      <label htmlFor="join-code" className="text-[13px] font-semibold text-subtle">
        {t.join.codeLabel}
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-md bg-input p-1 pl-3 focus-within:ring-2 focus-within:ring-ring",
          state.error && "ring-2 ring-destructive",
        )}
      >
        <KeyRound className="size-4 shrink-0 text-subtle" />
        <input
          id="join-code"
          name="code"
          key={state.code ?? ""}
          defaultValue={state.code}
          required
          autoFocus={shouldAutoFocus}
          autoComplete="off"
          spellCheck={false}
          maxLength={JOIN_CODE_LENGTH + JOIN_CODE_INPUT_SLACK}
          placeholder={t.join.codePlaceholder}
          aria-invalid={Boolean(state.error)}
          aria-describedby="join-code-help"
          className="h-9 min-w-0 flex-1 bg-transparent font-mono text-base tracking-[0.2em] text-foreground outline-none placeholder:tracking-normal placeholder:text-subtle placeholder:normal-case"
        />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? <LoaderCircle className="animate-spin" /> : null} {t.join.joinButton}
        </Button>
      </div>
      <p
        id="join-code-help"
        role={state.error ? "alert" : undefined}
        className={cn("text-xs", state.error ? "text-destructive" : "text-subtle")}
      >
        {state.error ?? t.join.codeHelp}
      </p>
    </form>
  );
}
