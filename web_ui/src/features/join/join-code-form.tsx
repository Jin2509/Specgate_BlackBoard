// Ô nhập mã tham gia workspace chung; gửi xong chuyển sang trang chờ chủ workspace duyệt.
"use client";

import { KeyRound, LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { JOIN_CODE_LENGTH } from "@/lib/join-code";
import { joinWithCode, type JoinCodeState } from "@/lib/join-actions";
import { cn } from "@/lib/utils";

export function JoinCodeForm({ autoFocus = false, className }: { autoFocus?: boolean; className?: string }) {
  const [state, action, pending] = useActionState<JoinCodeState, FormData>(joinWithCode, {});

  return (
    <form action={action} className={cn("grid gap-2", className)}>
      <label htmlFor="join-code" className="text-[13px] font-semibold text-subtle">
        Mã tham gia
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
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          maxLength={JOIN_CODE_LENGTH + 4}
          placeholder="VD: ADM7Q3P"
          aria-invalid={Boolean(state.error)}
          aria-describedby="join-code-help"
          className="h-9 min-w-0 flex-1 bg-transparent font-mono text-base tracking-[0.2em] text-foreground outline-none placeholder:tracking-normal placeholder:text-subtle placeholder:normal-case"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" /> : null} Tham gia
        </Button>
      </div>
      <p
        id="join-code-help"
        role={state.error ? "alert" : undefined}
        className={cn("text-xs", state.error ? "text-destructive" : "text-subtle")}
      >
        {state.error ?? "Xin mã từ một thành viên. Chủ workspace duyệt xong là bạn vào nhóm."}
      </p>
    </form>
  );
}
