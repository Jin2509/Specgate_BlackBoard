// Tính mức dùng so với trần chi phí của agent.
export function budgetLevel(spent: number, budget: number): { ratio: number; warn: boolean; over: boolean } {
  const ratio = budget > 0 ? Math.min(spent / budget, 1) : 1;
  return { ratio, warn: ratio >= 0.9, over: spent >= budget };
}
