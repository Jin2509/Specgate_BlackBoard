// Chọn mô hình trong danh sách nhà cung cấp trả về; đổi là lưu ngay.
"use client";

import { useRef } from "react";
import { pickModel } from "@/lib/private-actions";

export function ModelPicker({ models, value }: { models: string[]; value: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={pickModel}>
      <label htmlFor="model" className="text-[13px] font-semibold text-muted-foreground">
        Mô hình
      </label>
      <select
        id="model"
        name="model"
        defaultValue={value}
        onChange={() => formRef.current?.requestSubmit()}
        className="mt-1.5 block h-9 w-full max-w-xs rounded-md border border-border bg-input px-2.5 font-mono text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {models.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </form>
  );
}
