// Defines ADOM paper runs attached to a workspace: criteria, per-task results and progress.
export type Validity = "valid" | "invalidated";
export type Verdict = "PASS" | "FAIL" | "INSUFFICIENT_DATA" | "NOT_SET";
export type RunKind = "import" | "trial";
export type TrialLevel = "A1" | "A3";
export type RunState = "removed" | "invalidated" | "superseded";

export interface Criterion {
  number: number;
  title: string;
  value: number | null;
  display: string;
  numerator?: number | null;
  denominator?: number | null;
  /** Null when the ADOM export does not record how many tasks feed this criterion. */
  tasks: number | null;
  ciLow?: number | null;
  ciHigh?: number | null;
  threshold?: { op: "<=" | ">="; value: number } | null;
  footnote: string;
  verdict: Verdict;
}

export interface RepairRow {
  method: string;
  good: number;
  wrongSide: number;
  overRelax: number;
  unmeasured: number;
  noCandidate: number;
  notRepaired: number;
}

export interface TaskResult {
  taskId: string;
  status?: string;
  violations: number;
  share: number;
  a3State: string;
  contributing: boolean;
  wallSeconds: number;
}

export interface RunProgress {
  step?: string;
  current?: string;
  done?: Array<{ taskId: string; violations: number }>;
  total?: number;
}

export interface CardRun {
  id: string;
  name: string;
  kind: RunKind;
  dataset: string;
  tasks: number;
  validity: Validity;
  invalidReason: string | null;
  variant: string | null;
}

export interface PaperRun extends CardRun {
  workspaceId: string;
  status: "running" | "done" | "failed";
  error: string | null;
  progress: RunProgress;
  config: { taskIds?: string[]; level?: TrialLevel };
  models: Array<{ role: string; model: string }>;
  createdBy: string;
  createdAt: string;
  finishedAt: string | null;
  criteria: Criterion[];
  violations: number;
  taskResults?: TaskResult[];
  repairs?: RepairRow[];
  meta?: Record<string, unknown>;
  isCurrent?: boolean;
}

export interface RunList {
  runs: PaperRun[];
  currentId: string | null;
  runningId: string | null;
  canManage: boolean;
  trialMaxTasks: number;
  trialMode: "fake" | "pipeline";
}
