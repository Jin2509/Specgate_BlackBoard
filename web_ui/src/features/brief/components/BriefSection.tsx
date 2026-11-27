// Renders one titled section of the summary.
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export function BriefSection({
  icon,
  title,
  toneClassName,
  children,
}: {
  icon: ReactNode;
  title: string;
  toneClassName: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className={cn("mb-3 flex items-center gap-1.5 text-[0.8125rem] font-semibold [&_svg]:size-4", toneClassName)}>
        {icon}
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}
