"use client";
// Enters the personal agent's API key; the provider and address are recognised from the key, with a custom address as fallback.
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useActionErrorToast } from "@/hooks/use-action-error-toast";
import { format, t } from "@/lib/i18n";

import { updateKey, type KeyFormState } from "../api/key-actions";
import { BASE_URL_SUGGESTIONS, DEFAULT_BASE_URL, detectKeyProvider, type KeyProviderMatch } from "../utils/key-provider";

function toSubmitLabel(isPending: boolean, hasKey: boolean): string {
  if (isPending) return t.personal.checkingKey;
  return hasKey ? t.personal.checkAndReplace : t.personal.checkAndSave;
}

function toKeyStatus(apiKey: string, detected: KeyProviderMatch | null, customBaseUrl: string): string {
  if (!apiKey.trim()) return t.personal.keyLead;
  if (customBaseUrl) return format(t.personal.keyCustomAddress, { url: customBaseUrl });
  if (!detected) return t.personal.keyUnknown;
  const recognised = format(t.personal.keyDetected, { provider: detected.name });
  return detected.baseUrl ? `${recognised} ${format(t.personal.keyAddressAuto, { url: detected.baseUrl })}` : recognised;
}

export function KeyForm({
  hasKey,
  note,
}: {
  hasKey: boolean;
  /** Reminder about subscription plans, provided by the backend. */
  note: string;
}) {
  const [state, formAction, isPending] = useActionState<KeyFormState, FormData>(updateKey, {});
  useActionErrorToast(state);
  // Controlled so both fields survive the form reset React does after a rejected key.
  const [apiKey, setApiKey] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [isKeyShown, setIsKeyShown] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const detected = detectKeyProvider(apiKey);
  const trimmedCustomUrl = customBaseUrl.trim();
  const provider = trimmedCustomUrl ? "openai-compatible" : (detected?.provider ?? "openai-compatible");
  const baseUrl = provider === "anthropic" ? "" : trimmedCustomUrl || detected?.baseUrl || "";
  const isUnknownKey = Boolean(apiKey.trim()) && !detected;
  const isCustomShown = isCustomOpen || isUnknownKey || Boolean(trimmedCustomUrl);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="provider" value={provider} />
      <input type="hidden" name="baseUrl" value={baseUrl} />

      <div className="grid gap-1.5">
        <Label htmlFor="api-key" className="text-[0.8125rem] font-semibold text-muted-foreground">
          API key
        </Label>
        <div className="relative">
          <Input
            id="api-key"
            name="apiKey"
            type={isKeyShown ? "text" : "password"}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            required
            aria-invalid={state.error ? true : undefined}
            aria-describedby="key-status key-note"
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
        <p id="key-status" aria-live="polite" className="text-xs leading-relaxed [overflow-wrap:anywhere] text-muted-foreground">
          {toKeyStatus(apiKey, detected, trimmedCustomUrl)}
        </p>
      </div>

      {provider !== "anthropic" || trimmedCustomUrl ? (
        <div className="grid gap-1.5">
          {isUnknownKey ? null : (
            <button
              type="button"
              onClick={() => setIsCustomOpen((isOpen) => !isOpen)}
              aria-expanded={isCustomShown}
              className="w-fit text-xs font-medium text-primary-strong hover:underline"
            >
              {isCustomShown ? t.personal.hideCustomAddress : t.personal.customAddress}
            </button>
          )}
          {isCustomShown ? (
            <>
              <Label htmlFor="base-url" className="text-[0.8125rem] font-semibold text-muted-foreground">
                {t.personal.apiAddress}
              </Label>
              <Input
                id="base-url"
                value={customBaseUrl}
                onChange={(event) => setCustomBaseUrl(event.target.value)}
                list="base-url-suggestions"
                placeholder={format(t.personal.addressDefault, { url: detected?.baseUrl ?? DEFAULT_BASE_URL })}
                inputMode="url"
                autoComplete="off"
              />
              <datalist id="base-url-suggestions">
                {BASE_URL_SUGGESTIONS.map((suggestion) => (
                  <option key={suggestion.url} value={suggestion.url} label={suggestion.label} />
                ))}
              </datalist>
            </>
          ) : null}
        </div>
      ) : null}

      <p id="key-note" className="text-xs leading-relaxed text-subtle">
        {format(t.personal.keyEncrypted, { note })}
      </p>

      <div>
        <Button type="submit" disabled={isPending || !apiKey.trim()}>
          {isPending ? <LoaderCircle className="animate-spin" /> : null}
          {toSubmitLabel(isPending, hasKey)}
        </Button>
      </div>
    </form>
  );
}
