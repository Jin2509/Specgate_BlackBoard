// Renders placeholder columns while the workspace shell loads the session.
const RAIL_TILE_KEYS = [0, 1, 2];
const SIDEBAR_LINE_KEYS = [0, 1, 2, 3];

export function ShellSkeleton() {
  return (
    <>
      <div className="flex w-20 shrink-0 flex-col items-center gap-3 bg-rail py-3 max-md:hidden">
        {RAIL_TILE_KEYS.map((key) => (
          <span key={key} className="size-11 animate-pulse rounded-xl bg-rail-tile" />
        ))}
      </div>
      <div className="w-60 shrink-0 bg-sidebar max-md:hidden">
        <div className="h-12 border-b border-sidebar-border" />
        <div className="space-y-2 p-4">
          {SIDEBAR_LINE_KEYS.map((key) => (
            <span key={key} className="block h-4 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
      <div className="flex-1 bg-canvas" />
    </>
  );
}
