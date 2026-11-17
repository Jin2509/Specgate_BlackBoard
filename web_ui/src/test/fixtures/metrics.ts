// Provides sample metrics for UI tests: run MAIN values, where criterion 5 clears its threshold without enough data.
import type { Criterion, TaskResult } from "@/types/run";

export const sampleCriteria: Criterion[] = [
  {
    number: 1,
    title: "Wrong SPEC_FAULT verdict rate",
    value: 0,
    display: "0.000",
    numerator: 0,
    denominator: 131,
    tasks: 10,
    ciLow: 0,
    ciHigh: 0,
    threshold: { op: "<=", value: 0.1 },
    footnote: "",
    verdict: "PASS",
  },
  {
    number: 5,
    title: "Good repair rate",
    value: 0.667,
    display: "0.667",
    numerator: 18,
    denominator: 27,
    tasks: 7,
    ciLow: 0.17,
    ciHigh: 0.97,
    threshold: { op: ">=", value: 0.3 },
    footnote: "",
    verdict: "INSUFFICIENT_DATA",
  },
];

export const sampleTasks: TaskResult[] = [
  { taskId: "HumanEval/38", violations: 118, share: 42.6, a3State: "AGREE", contributing: true, wallSeconds: 1296 },
  { taskId: "HumanEval/93", violations: 23, share: 8.3, a3State: "AGREE", contributing: true, wallSeconds: 41 },
  { taskId: "HumanEval/161", violations: 16, share: 5.8, a3State: "DISAGREE", contributing: false, wallSeconds: 19 },
];
