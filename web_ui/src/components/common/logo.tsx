// Logo SpecGate Workspace.
import { Presentation } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground", className)}
    >
      <Presentation className="size-[55%]" />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-bold tracking-tight text-foreground", className)}>
      <LogoMark />
      SpecGate
    </span>
  );
}
