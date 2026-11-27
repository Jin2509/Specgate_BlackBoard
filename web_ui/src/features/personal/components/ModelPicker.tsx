"use client";
// Picks the model among those the provider returned; a change is saved at once.
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Select } from "@/components/ui/Select";
import { t } from "@/lib/i18n";
import { showErrorToast } from "@/stores/toast-store";

import { updateModel } from "../api/key-actions";

export function ModelPicker({ models, value }: { models: string[]; value: string }) {
  const router = useRouter();
  const [model, setModel] = useState(value);
  const [isPending, startTransition] = useTransition();

  function handleChange(nextModel: string) {
    setModel(nextModel);
    startTransition(async () => {
      const outcome = await updateModel(nextModel);
      if (outcome.error) {
        setModel(value);
        return showErrorToast(outcome.error);
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <label htmlFor="model" className="text-[0.8125rem] font-medium text-muted-foreground">
        {t.personal.model}
      </label>
      <Select
        id="model"
        size="lg"
        value={model}
        onValueChange={handleChange}
        isDisabled={isPending}
        className="flex w-full max-w-xs font-mono"
        options={models.map((option) => ({ value: option, label: option }))}
      />
    </div>
  );
}
