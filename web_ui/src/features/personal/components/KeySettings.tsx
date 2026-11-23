"use client";
// Shows the personal agent (provider, key, model) and reveals the key form only when the user chooses to change it.
import { KeyRound, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SettingsSection } from "@/components/SettingsSection";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";
import { showErrorToast } from "@/stores/toast-store";
import type { ProviderKey, ProviderKind } from "@/types/agent";

import { KeyForm } from "./KeyForm";
import { ModelPicker } from "./ModelPicker";
import { deleteKey } from "../api/key-actions";

const PROVIDER_LABELS: Record<ProviderKind, string> = {
  anthropic: "Anthropic",
  "openai-compatible": t.personal.openAiLabel,
};

export function KeySettings({
  providerKey,
  note,
  savedAtLabel,
}: {
  providerKey: ProviderKey | null;
  note: string;
  savedAtLabel: string;
}) {
  const [isChanging, setIsChanging] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, startTransition] = useTransition();
  const isFormShown = !providerKey || isChanging;

  return (
    <>
      {providerKey ? (
        <SettingsSection title={t.personal.agentSection} description={t.personal.agentSectionDescription}>
          <div className="rounded-lg border border-border bg-card">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-agent-soft text-agent">
                <KeyRound className="size-4" />
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-sm font-medium text-foreground">{PROVIDER_LABELS[providerKey.provider]}</p>
                <p className="truncate text-xs text-subtle">
                  <span aria-hidden>••••</span>
                  <span className="sr-only">{t.personal.endsWith}</span>
                  <span className="font-mono">{providerKey.keyLast4}</span>
                  {providerKey.baseUrl ? <span className="font-mono"> · {providerKey.baseUrl}</span> : null}
                  {` · ${t.personal.savedAt} ${savedAtLabel}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="secondary" size="sm" onClick={() => setIsChanging((changing) => !changing)}>
                  {isChanging ? t.personal.cancelChange : t.personal.changeKey}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t.personal.deleteKey}
                  title={t.personal.deleteKey}
                  onClick={() => setIsConfirmOpen(true)}
                  className="text-subtle hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
            <div className="border-t border-border px-4 py-3">
              <ModelPicker models={providerKey.models} value={providerKey.model} />
            </div>
          </div>
        </SettingsSection>
      ) : null}

      {isFormShown ? (
        <SettingsSection title={t.personal.keySection} description={t.personal.keySectionDescription}>
          <div className="rounded-lg border border-border bg-card p-4">
            <KeyForm hasKey={Boolean(providerKey)} note={note} />
          </div>
        </SettingsSection>
      ) : null}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={t.personal.deleteKeyTitle}
        description={t.personal.deleteKeyBody}
        confirmLabel={t.personal.deleteKey}
        isPending={isDeleting}
        onConfirm={() =>
          startTransition(async () => {
            const outcome = await deleteKey();
            if (outcome.error) showErrorToast(outcome.error);
          })
        }
      />
    </>
  );
}
