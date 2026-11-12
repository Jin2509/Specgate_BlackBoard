// Form nhập API key của workspace riêng: chọn nhà cung cấp, nhập key, kiểm và lưu.
"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/common/segmented-control";
import { saveKey, type KeyFormState } from "@/lib/private-actions";
import type { ProviderKind } from "@/lib/types";

const PROVIDERS: Array<{ value: ProviderKind; label: string; hint: string }> = [
  { value: "anthropic", label: "Anthropic", hint: "Key bắt đầu bằng sk-ant-, tạo ở console.anthropic.com." },
  {
    value: "openai-compatible",
    label: "Kiểu OpenAI",
    hint: "OpenAI, OpenRouter, DeepSeek, Groq, Ollama… Dịch vụ nào dùng định dạng của OpenAI thì nhập địa chỉ API của nó.",
  },
];

export function KeyForm({ hasKey, defaultProvider }: { hasKey: boolean; defaultProvider: ProviderKind }) {
  const [state, action, pending] = useActionState<KeyFormState, FormData>(saveKey, {});
  const [provider, setProvider] = useState<ProviderKind>(defaultProvider);
  const [show, setShow] = useState(false);
  const meta = PROVIDERS.find((p) => p.value === provider)!;

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="provider" value={provider} />
      <div className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-muted-foreground">Nhà cung cấp</span>
        <SegmentedControl
          aria-label="Nhà cung cấp"
          value={provider}
          onChange={setProvider}
          className="inline-flex w-fit gap-0.5 p-0.5"
          itemClassName="px-3 py-1.5 text-sm"
          options={PROVIDERS.map((p) => ({ value: p.value, label: p.label }))}
        />
        <p className="text-xs leading-relaxed text-subtle">{meta.hint}</p>
      </div>

      {provider === "openai-compatible" ? (
        <div className="grid gap-1.5">
          <Label htmlFor="base-url" className="text-[13px] font-semibold text-muted-foreground">
            Địa chỉ API
          </Label>
          <Input id="base-url" name="baseUrl" placeholder="https://api.openai.com/v1" inputMode="url" autoComplete="off" />
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
            type={show ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            required
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "key-error" : "key-note"}
            className="pr-10 font-mono"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Ẩn key" : "Hiện key"}
            className="absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded text-subtle hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {state.error ? (
          <p id="key-error" role="alert" className="text-[13px] text-destructive">
            {state.error}
          </p>
        ) : (
          <p id="key-note" className="text-xs leading-relaxed text-subtle">
            Gói thuê bao như ChatGPT Plus hay Claude Pro không phải API key. Key được mã hóa khi lưu; sau đó chỉ còn hiện 4 ký tự
            cuối.
          </p>
        )}
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" /> : null}
          {pending ? "Đang kiểm key" : hasKey ? "Kiểm và thay key" : "Kiểm và lưu key"}
        </Button>
      </div>
    </form>
  );
}
