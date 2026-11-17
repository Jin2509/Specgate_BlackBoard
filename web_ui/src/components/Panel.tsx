// Renders a flat content block with an optional small title, icon and actions.
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export function Panel({
  title,
  icon,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("min-w-0 rounded-lg bg-card", className)}>
      {title ? (
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          {icon ? <span className="text-subtle [&_svg]:size-4">{icon}</span> : null}
          <h2 className="text-[13px] font-semibold text-muted-foreground">{title}</h2>
          {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn("px-4 pb-4", !title && "pt-4", bodyClassName)}>{children}</div>
    </section>
  );
}
