"use client";
// Picks the model among those the provider returned; a change is saved at once.
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Select } from "@/components/ui/Select";
import { t } from "@/lib/i18n";

import { updateModel } from "../api/key-actions";

export function ModelPicker({ models, value }: { models: string[]; value: string }) {
  const router = useRouter();
  const [model, setModel] = useState(value);
  const [isPending, startTransition] = useTransition();

  function handleChange(nextModel: string) {
    setModel(nextModel);
    const formData = new FormData();
    formData.set("model", nextModel);
    startTransition(async () => {
      await updateModel(formData);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <label htmlFor="model" className="text-[13px] font-medium text-muted-foreground">
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
