// Thanh thông tin lượt chạy: biến thể, số tác vụ, các mô hình.
import type { ReactNode } from "react";
import type { Run } from "@/lib/types";

export function RunStatusBar({ run }: { run: Run }) {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-2 rounded-lg bg-card px-4 py-3">
      <Field label="Lượt · biến thể">
        <span className="font-semibold">{run.name}</span> · <span className="font-mono text-xs">{run.primaryVariant}</span>
      </Field>
      <Field label="Tác vụ">
        <span className="tabular font-semibold">{run.tasks}</span>{" "}
        <span className="text-xs text-muted-foreground">({run.tasksWithSpec} có spec)</span>
      </Field>
      {run.models.map((m) => (
        <Field key={m.role} label={m.role}>
          <span className="font-mono text-xs">{m.model}</span>
        </Field>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-subtle">{label}</p>
      <p className="text-[13px] whitespace-nowrap">{children}</p>
    </div>
  );
}
