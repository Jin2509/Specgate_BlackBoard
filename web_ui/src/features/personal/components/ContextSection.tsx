// Renders one titled section of the agent context panel.
import type { ReactNode } from "react";

export function ContextSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-subtle [&_svg]:size-3.5">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}
