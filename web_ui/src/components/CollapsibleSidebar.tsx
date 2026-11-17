"use client";
// Renders a collapsible side column: it shrinks to zero on wide screens and becomes an overlay drawer on narrow ones.
import { ChevronLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

import { t, format } from "@/lib/i18n";
import { cn } from "@/utils/cn";

type Side = "left" | "right";
type Breakpoint = "md" | "lg" | "xl";

const MEDIA_QUERIES: Record<Breakpoint, string> = {
  md: "(min-width: 48rem)",
  lg: "(min-width: 64rem)",
  xl: "(min-width: 80rem)",
};

// Tailwind only sees complete class strings, so every side and breakpoint pair spells its classes out.
const VARIANT_CLASSES: Record<`${Side}-${Breakpoint}`, { panel: string; backdrop: string; button: string; icon: string }> = {
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
  "left-xl": {
    panel:
      "max-xl:fixed max-xl:inset-y-0 max-xl:left-0 max-xl:z-40 max-xl:shadow-float max-xl:data-[mobile=closed]:-translate-x-full max-xl:data-[mobile=closed]:shadow-none xl:relative xl:data-[desktop=closed]:w-0",
    backdrop: "xl:hidden",
    button: "left-full rounded-r-md border-l-0",
    icon: "max-xl:group-data-[mobile=closed]/panel:rotate-180 xl:group-data-[desktop=closed]/panel:rotate-180",
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
  "right-xl": {
    panel:
      "max-xl:fixed max-xl:inset-y-0 max-xl:right-0 max-xl:z-40 max-xl:shadow-float max-xl:data-[mobile=closed]:translate-x-full max-xl:data-[mobile=closed]:shadow-none xl:relative xl:data-[desktop=closed]:w-0",
    backdrop: "xl:hidden",
    button: "right-full rounded-l-md border-r-0",
    icon: "rotate-180 max-xl:group-data-[mobile=closed]/panel:rotate-0 xl:group-data-[desktop=closed]/panel:rotate-0",
  },
};

const STORAGE_PREFIX = "sg:sidebar:";
const CHANGE_EVENT = "sg:sidebar-change";
const COLLAPSED_VALUE = "collapsed";

function isStoredCollapsed(id: string): boolean {
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + id) === COLLAPSED_VALUE;
  } catch {
    // Storage can be blocked (private window); the column then simply starts expanded.
    return false;
  }
}

function storeCollapsed(id: string, isCollapsed: boolean): void {
  try {
    if (isCollapsed) window.localStorage.setItem(STORAGE_PREFIX + id, COLLAPSED_VALUE);
    else window.localStorage.removeItem(STORAGE_PREFIX + id);
  } catch {
    // Without storage the choice still applies to this page; it is only not remembered.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Remember the wide-screen choice per column, so it survives navigation and reloads. */
function useStoredDesktopOpen(id: string): [boolean, (isOpen: boolean) => void] {
  const isOpen = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("storage", onChange);
      window.addEventListener(CHANGE_EVENT, onChange);
      return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener(CHANGE_EVENT, onChange);
      };
    },
    () => !isStoredCollapsed(id),
    () => true,
  );
  return [isOpen, (nextIsOpen: boolean) => storeCollapsed(id, !nextIsOpen)];
}

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", onChange);
      return () => mediaQueryList.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => true,
  );
}

export function CollapsibleSidebar({
  id,
  side,
  breakpoint = "md",
  label,
  widthClassName,
  className,
  children,
}: {
  /** Stable name under which the collapsed state is remembered. */
  id: string;
  side: Side;
  /** From this breakpoint up the column sits in the page flow; below it, it becomes a drawer. */
  breakpoint?: Breakpoint;
  /** Column name used in the toggle button's label. */
  label: string;
  /** Width when expanded, for example "w-64". */
  widthClassName: string;
  className?: string;
  children: ReactNode;
}) {
  const isDesktop = useMediaQuery(MEDIA_QUERIES[breakpoint]);
  const [isDesktopOpen, setIsDesktopOpen] = useStoredDesktopOpen(id);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const variant = VARIANT_CLASSES[`${side}-${breakpoint}`];

  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setIsMobileOpen(false);
  }

  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setIsMobileOpen(false);
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  // A remembered "collapsed" state is applied right after hydration; animating that first change would look like a glitch.
  const [canAnimate, setCanAnimate] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setCanAnimate(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const isExpanded = isDesktop ? isDesktopOpen : isMobileOpen;
  const toggleLabel = format(isExpanded ? t.common.collapse : t.common.expand, { label });

  function handleToggle() {
    if (window.matchMedia(MEDIA_QUERIES[breakpoint]).matches) setIsDesktopOpen(!isDesktopOpen);
    else setIsMobileOpen((open) => !open);
  }

  return (
    <>
      {isMobileOpen ? (
        <div
          aria-hidden
          onClick={() => setIsMobileOpen(false)}
          className={cn("fixed inset-0 z-30 bg-black/60", variant.backdrop)}
        />
      ) : null}
      <div
        data-desktop={isDesktopOpen ? "open" : "closed"}
        data-mobile={isMobileOpen ? "open" : "closed"}
        className={cn(
          "group/panel z-20 flex shrink-0",
          canAnimate && "transition-[width,translate] duration-200 ease-out motion-reduce:transition-none",
          widthClassName,
          variant.panel,
        )}
      >
        <div className="h-full w-full overflow-hidden">
          <div inert={!isExpanded} className={cn("flex h-full", widthClassName, className)}>
            {children}
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isExpanded}
          aria-label={toggleLabel}
          title={toggleLabel}
          className={cn(
            "absolute top-1/2 flex h-12 w-4 -translate-y-1/2 items-center justify-center border border-sidebar-border bg-sidebar text-subtle shadow-[0_1px_4px_rgb(0_0_0/0.3)] transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            variant.button,
          )}
        >
          <ChevronLeft className={cn("size-3.5 transition-transform duration-200", variant.icon)} />
        </button>
      </div>
    </>
  );
}
