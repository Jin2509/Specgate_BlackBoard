// Shows why a request failed inside the dialog or form that sent it, where screen readers can reach it.
import { CircleAlert } from "lucide-react";

export function FormAlert({ message }: { message: string | null }) {
  // A modal hides everything outside it from assistive technology, so a toast there would go unheard.
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-md bg-rejected-soft px-3 py-2 text-sm text-foreground">
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-rejected" />
      <span className="min-w-0 break-words">{message}</span>
    </p>
  );
}
