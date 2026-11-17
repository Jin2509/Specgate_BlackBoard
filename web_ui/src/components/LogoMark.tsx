// Draws the SpecGate gate mark: two posts, a lintel and a cross bar in the primary colour.
import { cn } from "@/utils/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={cn("size-8 text-primary", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 8.5c7.5-1.6 16.5-1.6 24 0" />
      <path d="M9 9v17" />
      <path d="M23 9v17" />
      <path d="M9 15.5h14" />
      <path d="M13 21.5h6" opacity="0.55" />
    </svg>
  );
}
