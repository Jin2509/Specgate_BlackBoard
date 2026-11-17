// Shows the run details: variant, task count, violations and the model playing each role.
import type { ReactNode } from "react";

import { t } from "@/lib/i18n";
import type { PaperRun } from "@/types/run";

export function RunStatusBar({ run }: { run: PaperRun }) {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-2 rounded-lg bg-card px-4 py-3">
      <Field label={t.metrics.variant}>
        <span className="font-mono text-xs">{run.variant ?? "?"}</span>
      </Field>
      <Field label={t.metrics.tasks}>
        <span className="tabular font-semibold">{run.tasks}</span>
      </Field>
      <Field label={t.metrics.violations}>
        <span className="tabular font-semibold">{run.violations}</span>
      </Field>
      {run.models.map((roleModel) => (
        <Field key={roleModel.role} label={roleModel.role}>
          <span className="font-mono text-xs">{roleModel.model}</span>
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
