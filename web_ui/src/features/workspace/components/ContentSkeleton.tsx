// Shows a placeholder for the content area while a workspace page loads; the rail and sidebar stay in place.
import { t } from "@/lib/i18n";

export function ContentSkeleton() {
  return (
    <div aria-busy="true" aria-label={t.common.loading} className="flex min-w-0 flex-1 flex-col bg-canvas">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
        <span className="h-4 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-3 p-6">
        <span className="block h-4 w-2/3 animate-pulse rounded bg-muted" />
        <span className="block h-4 w-1/2 animate-pulse rounded bg-muted" />
        <span className="block h-4 w-3/5 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
