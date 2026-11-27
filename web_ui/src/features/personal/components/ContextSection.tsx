// Renders one titled, foldable section of the agent context panel; sections the user rarely reads start folded.
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export function ContextSection({
  icon,
  title,
  isInitiallyOpen = true,
  children,
}: {
  icon: ReactNode;
  title: string;
  isInitiallyOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={isInitiallyOpen} className="group/section">
      <summary className="mb-1.5 flex cursor-pointer list-none items-center gap-1.5 rounded text-[0.78125rem] font-semibold text-subtle hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&_svg]:size-3.5 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="transition-transform group-open/section:rotate-90" />
        {icon}
        {title}
      </summary>
      {children}
    </details>
  );
}
