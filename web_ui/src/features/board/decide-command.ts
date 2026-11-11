// Sinh lệnh /decide tương đương với quyết định chốt/loại.
export type Decision = "decided" | "rejected";

export function decideCommand(number: number, decision: Decision, reason: string): string {
  const r = reason.trim();
  const short = r.length > 28 ? `${r.slice(0, 28)}…` : r;
  return `/decide #${number} ${decision === "decided" ? "chốt" : "loại"} ${short}`.trim();
}
