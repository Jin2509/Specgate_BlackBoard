// Renders a titled group of navigation links in a sidebar column.
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export function NavGroup({ label, action, children }: { label: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="pt-4">
      <div className="flex items-center gap-0.5 pr-2 pb-1 pl-0.5 text-subtle hover:text-muted-foreground">
        <ChevronDown className="size-3" />
        <span className="flex-1 truncate text-[13px] font-semibold">{label}</span>
        {action}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}
