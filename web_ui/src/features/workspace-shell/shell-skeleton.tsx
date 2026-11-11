// Khung chờ của workspace trong lúc đọc phiên đăng nhập.
export function ShellSkeleton() {
  return (
    <>
      <div className="flex w-18 shrink-0 flex-col items-center gap-2 bg-rail py-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-12 animate-pulse rounded-3xl bg-rail-tile" />
        ))}
      </div>
      <div className="w-60 shrink-0 bg-sidebar">
        <div className="h-12 border-b border-sidebar-border" />
        <div className="space-y-2 p-4">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="block h-4 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
      <div className="flex-1 bg-canvas" />
    </>
  );
}
