// Khung trang dùng chung: PageLayout, PageHeader và PageBody.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageLayout({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex min-w-0 flex-1 flex-col bg-canvas", className)}>{children}</div>;
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("@container flex-1 scrollbar-thin overflow-y-auto p-4 lg:p-6", className)}>{children}</div>;
}

export function PageHeader({
  title,
  icon,
  meta,
  actions,
  className,
}: {
  title: ReactNode;
  icon?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex h-12 shrink-0 items-center gap-2 border-b border-sidebar-border px-4 shadow-[0_1px_0_rgb(0_0_0/0.2)]",
        className,
      )}
    >
      {icon ? <span className="text-subtle [&_svg]:size-5">{icon}</span> : null}
      <h1 className="shrink-0 text-[15px] font-semibold whitespace-nowrap text-sidebar-accent-foreground">{title}</h1>
      {meta ? (
        <span className="flex min-w-0 items-center gap-2 max-lg:hidden">
          <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-border" />
          <span className="truncate text-sm text-subtle">{meta}</span>
        </span>
      ) : null}
      {actions ? <div className="ml-auto flex shrink-0 items-center gap-1">{actions}</div> : null}
    </header>
  );
}
