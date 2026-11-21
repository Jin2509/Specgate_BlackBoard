"use client";
// Enters the personal agent's API key: pick a provider, type the key, and let the backend check and store it.
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useActionState, useState } from "react";

import { SegmentedControl } from "@/components/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { format, t } from "@/lib/i18n";
import type { ProviderKind } from "@/types/agent";

import { updateKey, type KeyFormState } from "../api/key-actions";

const PROVIDERS: ReadonlyArray<{ value: ProviderKind; label: string; hint: string }> = [
  { value: "anthropic", label: "Anthropic", hint: t.personal.anthropicHint },
  { value: "openai-compatible", label: t.personal.openAiLabel, hint: t.personal.openAiHint },
];

const BASE_URL_SUGGESTIONS: ReadonlyArray<{ url: string; label: string }> = [
  { url: "https://api.openai.com/v1", label: "OpenAI" },
  { url: "https://generativelanguage.googleapis.com/v1beta/openai", label: "Google Gemini" },
  { url: "https://openrouter.ai/api/v1", label: "OpenRouter" },
  { url: "https://api.deepseek.com/v1", label: "DeepSeek" },
  { url: "https://api.groq.com/openai/v1", label: "Groq" },
];

function toSubmitLabel(isPending: boolean, hasKey: boolean): string {
  if (isPending) return t.personal.checkingKey;
  return hasKey ? t.personal.checkAndReplace : t.personal.checkAndSave;
}

export function KeyForm({
  hasKey,
  defaultProvider,
  note,
}: {
  hasKey: boolean;
  defaultProvider: ProviderKind;
  /** Reminder about subscription plans, provided by the backend. */
  note: string;
}) {
  const [state, formAction, isPending] = useActionState<KeyFormState, FormData>(updateKey, {});
  const [provider, setProvider] = useState<ProviderKind>(defaultProvider);
  const [isKeyShown, setIsKeyShown] = useState(false);
  const providerHint = PROVIDERS.find((option) => option.value === provider)?.hint;

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="provider" value={provider} />
      <div className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-muted-foreground">{t.personal.provider}</span>
        <SegmentedControl
          aria-label={t.personal.provider}
          value={provider}
          onChange={setProvider}
          className="inline-flex w-fit gap-0.5 p-0.5"
          itemClassName="px-3 py-1.5 text-sm"
          options={PROVIDERS.map((option) => ({ value: option.value, label: option.label }))}
        />
        <p className="text-xs leading-relaxed text-subtle">{providerHint}</p>
      </div>

      {provider === "openai-compatible" ? (
        <div className="grid gap-1.5">
          <Label htmlFor="base-url" className="text-[13px] font-semibold text-muted-foreground">
            {t.personal.apiAddress}
          </Label>
          <Input
            id="base-url"
            name="baseUrl"
            list="base-url-suggestions"
            placeholder="https://api.openai.com/v1"
            inputMode="url"
            autoComplete="off"
          />
          <datalist id="base-url-suggestions">
            {BASE_URL_SUGGESTIONS.map((suggestion) => (
              <option key={suggestion.url} value={suggestion.url} label={suggestion.label} />
            ))}
          </datalist>
        </div>
      ) : null}

      <div className="grid gap-1.5">
        <Label htmlFor="api-key" className="text-[13px] font-semibold text-muted-foreground">
          API key
        </Label>
        <div className="relative">
          <Input
            id="api-key"
            name="apiKey"
            type={isKeyShown ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            required
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "key-error" : "key-note"}
            className="pr-10 font-mono"
          />
          <button
            type="button"
            onClick={() => setIsKeyShown((isShown) => !isShown)}
            aria-label={isKeyShown ? t.personal.hideKey : t.personal.showKey}
            className="absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded text-subtle hover:text-foreground"
          >
            {isKeyShown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {state.error ? (
          <p id="key-error" role="alert" className="text-[13px] text-destructive">
            {state.error}
          </p>
        ) : (
          <p id="key-note" className="text-xs leading-relaxed text-subtle">
            {format(t.personal.keyEncrypted, { note })}
          </p>
        )}
      </div>

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? <LoaderCircle className="animate-spin" /> : null}
          {toSubmitLabel(isPending, hasKey)}
        </Button>
      </div>
    </form>
  );
}
