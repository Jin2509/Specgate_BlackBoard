// Thẻ kết quả chạy thử do lệnh /run đưa vào kênh.
import { Check, Play } from "lucide-react";
import { ToneBadge } from "@/components/common/tone-badge";
import { cn } from "@/lib/utils";

const STEPS = ["setup", "admit", "run"];

export function RunProgressCard({
  tasks,
  seconds,
  violations,
  className,
}: {
  tasks: string[];
  seconds: number;
  violations: number;
  className?: string;
}) {
  return (
    <div className={cn("max-w-115 rounded border-l-4 border-data bg-card p-3", className)}>
      <div className="flex items-center gap-2 text-xs">
        <Play className="size-3.5 text-data" />
        <span className="font-medium text-data">Chạy thử · {tasks.length} tác vụ · dữ liệu fixture</span>
        <ToneBadge tone="decided" className="ml-auto">
          xong {seconds} s
        </ToneBadge>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11.5px] text-muted-foreground">
        <span>{tasks.map((t, i) => (i === 0 ? t : t.replace("HumanEval", ""))).join(" · ")}</span>
        {STEPS.map((s) => (
          <span key={s} className="inline-flex items-center gap-0.5">
            {s} <Check className="size-3 text-decided" />
          </span>
        ))}
        <span>{violations} vi phạm</span>
      </div>
    </div>
  );
}
