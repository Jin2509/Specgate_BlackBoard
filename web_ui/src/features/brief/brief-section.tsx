// Mục và dòng trong bản tổng hợp.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function BriefSection({
  icon,
  title,
  tone,
  children,
}: {
  icon: ReactNode;
  title: string;
  tone: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className={cn("mb-3 flex items-center gap-1.5 text-[13px] font-semibold [&_svg]:size-4", tone)}>
        {icon}
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

export function BriefRow({ title, strong, children }: { title: string; strong?: boolean; children?: ReactNode }) {
  return (
    <div>
      <p className={cn("text-sm text-foreground", strong && "font-semibold text-sidebar-accent-foreground")}>{title}</p>
      {children ? <p className="mt-0.5 text-xs leading-relaxed text-subtle">{children}</p> : null}
    </div>
  );
}
