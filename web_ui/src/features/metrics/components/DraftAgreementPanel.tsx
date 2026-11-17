// Counts tasks by how the two A3 drafts agreed.
import { GitCompareArrows } from "lucide-react";

import { Panel } from "@/components/Panel";
import { t } from "@/lib/i18n";
import type { TaskResult } from "@/types/run";

const AGREEMENT_STATES = [
  { label: t.metrics.stateAgree, code: "AGREE" },
  { label: t.metrics.stateSingle, code: "SINGLE" },
  { label: t.metrics.stateDisagree, code: "DISAGREE" },
  { label: t.metrics.stateNoSpec, code: "no_spec" },
] as const;

export function DraftAgreementPanel({ tasks }: { tasks: readonly TaskResult[] }) {
  return (
    <Panel title={t.metrics.draftsTitle} icon={<GitCompareArrows />}>
      <ul className="divide-y text-[13px]">
        {AGREEMENT_STATES.map((state) => (
          <li key={state.code} className="flex items-center py-2">
            {state.label} <code className="ml-1.5 font-mono text-[11px] text-subtle">{state.code}</code>
            <span className="tabular ml-auto font-medium">{tasks.filter((task) => task.a3State === state.code).length}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
