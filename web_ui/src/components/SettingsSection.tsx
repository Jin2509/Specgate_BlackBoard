// Lays out one settings section: title and short explanation on the left, its controls on the right.
import type { ReactNode } from "react";

export function SettingsSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-b border-border py-7 first:pt-1 last:border-0 @3xl:grid-cols-[15rem_minmax(0,1fr)] @3xl:gap-10">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-[13px] leading-relaxed text-subtle">{description}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
