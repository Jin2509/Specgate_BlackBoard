// Cột bên thu/phóng được: nút mũi tên nằm giữa mép trong. Trên màn rộng cột co về 0, trên màn hẹp cột thành ngăn kéo phủ lên nội dung.
"use client";

import { ChevronLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Side = "left" | "right";
type Breakpoint = "md" | "lg";

const MEDIA: Record<Breakpoint, string> = {
  md: "(min-width: 48rem)",
  lg: "(min-width: 64rem)",
};

// Tailwind cần class viết nguyên chuỗi, nên mỗi tổ hợp cạnh × mốc màn hình có bộ class riêng.
const VARIANTS: Record<`${Side}-${Breakpoint}`, { panel: string; backdrop: string; button: string; icon: string }> = {
  "left-md": {
    panel:
      "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:shadow-float max-md:data-[mobile=closed]:-translate-x-full max-md:data-[mobile=closed]:shadow-none md:relative md:data-[desktop=closed]:w-0",
    backdrop: "md:hidden",
    button: "left-full rounded-r-md border-l-0",
    icon: "max-md:group-data-[mobile=closed]/panel:rotate-180 md:group-data-[desktop=closed]/panel:rotate-180",
  },
  "left-lg": {
    panel:
      "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40 max-lg:shadow-float max-lg:data-[mobile=closed]:-translate-x-full max-lg:data-[mobile=closed]:shadow-none lg:relative lg:data-[desktop=closed]:w-0",
    backdrop: "lg:hidden",
    button: "left-full rounded-r-md border-l-0",
    icon: "max-lg:group-data-[mobile=closed]/panel:rotate-180 lg:group-data-[desktop=closed]/panel:rotate-180",
  },
  "right-md": {
    panel:
      "max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:z-40 max-md:shadow-float max-md:data-[mobile=closed]:translate-x-full max-md:data-[mobile=closed]:shadow-none md:relative md:data-[desktop=closed]:w-0",
    backdrop: "md:hidden",
    button: "right-full rounded-l-md border-r-0",
    icon: "rotate-180 max-md:group-data-[mobile=closed]/panel:rotate-0 md:group-data-[desktop=closed]/panel:rotate-0",
  },
  "right-lg": {
    panel:
      "max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:z-40 max-lg:shadow-float max-lg:data-[mobile=closed]:translate-x-full max-lg:data-[mobile=closed]:shadow-none lg:relative lg:data-[desktop=closed]:w-0",
    backdrop: "lg:hidden",
    button: "right-full rounded-l-md border-r-0",
    icon: "rotate-180 max-lg:group-data-[mobile=closed]/panel:rotate-0 lg:group-data-[desktop=closed]/panel:rotate-0",
  },
};

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => true,
  );
}

export function CollapsibleSidebar({
  side,
  breakpoint = "md",
  label,
  widthClassName,
  className,
  children,
}: {
  side: Side;
  /** Từ mốc này trở lên cột nằm trong luồng trang; nhỏ hơn thì thành ngăn kéo. */
  breakpoint?: Breakpoint;
  /** Tên cột, dùng cho nhãn nút ("Thu gọn …" / "Mở …"). */
  label: string;
  /** Độ rộng khi mở, ví dụ "w-64". */
  widthClassName: string;
  className?: string;
  children: ReactNode;
}) {
  const isDesktop = useMediaQuery(MEDIA[breakpoint]);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const v = VARIANTS[`${side}-${breakpoint}`];

  // Đổi trang thì đóng ngăn kéo trên điện thoại.
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const expanded = isDesktop ? desktopOpen : mobileOpen;

  function toggle() {
    if (window.matchMedia(MEDIA[breakpoint]).matches) setDesktopOpen((o) => !o);
    else setMobileOpen((o) => !o);
  }

  return (
    <>
      {mobileOpen ? (
        <div aria-hidden onClick={() => setMobileOpen(false)} className={cn("fixed inset-0 z-30 bg-black/60", v.backdrop)} />
      ) : null}
      <div
        data-desktop={desktopOpen ? "open" : "closed"}
        data-mobile={mobileOpen ? "open" : "closed"}
        className={cn(
          "group/panel z-20 flex shrink-0 transition-[width,translate] duration-200 ease-out motion-reduce:transition-none",
          widthClassName,
          v.panel,
        )}
      >
        <div className="h-full w-full overflow-hidden">
          <div inert={!expanded} className={cn("flex h-full", widthClassName, className)}>
            {children}
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          aria-label={expanded ? `Thu gọn ${label}` : `Mở ${label}`}
          title={expanded ? `Thu gọn ${label}` : `Mở ${label}`}
          className={cn(
            "absolute top-1/2 flex h-12 w-4 -translate-y-1/2 items-center justify-center border border-sidebar-border bg-sidebar text-subtle shadow-[0_1px_4px_rgb(0_0_0/0.3)] transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            v.button,
          )}
        >
          <ChevronLeft className={cn("size-3.5 transition-transform duration-200", v.icon)} />
        </button>
      </div>
    </>
  );
}
