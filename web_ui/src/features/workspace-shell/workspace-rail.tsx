// Thanh workspace bên trái: workspace riêng, các workspace chung, tạo mới và khám phá.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Plus, Presentation } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQueryParam } from "@/hooks/use-query-param";
import type { Workspace } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";

export function WorkspaceRail({ items, activeId, personalId }: { items: Workspace[]; activeId: string; personalId: string }) {
  const exploreActive = usePathname().endsWith("/explore");
  const dialogFlag = useQueryParam("dialog");
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen ?? dialogFlag === "create";
  const shared = items.filter((w) => w.kind === "shared");

  return (
    <nav
      aria-label="Workspace"
      className="flex w-18 shrink-0 scrollbar-none flex-col items-center gap-2 overflow-y-auto bg-rail py-3"
    >
      <RailItem label="Workspace riêng" href={`/w/${personalId}/c/chung`} active={activeId === personalId && !exploreActive}>
        <Presentation className="size-6" />
      </RailItem>
      <div aria-hidden className="h-0.5 w-8 shrink-0 rounded-full bg-border" />

      {shared.map((ws) => (
        <RailItem key={ws.id} label={ws.name} href={`/w/${ws.id}/c/chung`} active={ws.id === activeId && !exploreActive}>
          {ws.short}
        </RailItem>
      ))}

      <RailItem label="Tạo workspace chung" onClick={() => setManualOpen(true)} action>
        <Plus className="size-6" />
      </RailItem>
      <RailItem label="Khám phá workspace chung" href={`/w/${personalId}/explore`} active={exploreActive} action>
        <Compass className="size-6" />
      </RailItem>

      <CreateWorkspaceDialog open={open} onOpenChange={setManualOpen} />
    </nav>
  );
}

function RailItem({
  label,
  href,
  onClick,
  active = false,
  action = false,
  children,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  action?: boolean;
  children: ReactNode;
}) {
  const tile = cn(
    "flex size-12 items-center justify-center overflow-hidden text-[15px] font-semibold transition-all duration-150",
    active
      ? "rounded-2xl bg-primary text-primary-foreground"
      : cn(
          "rounded-3xl bg-rail-tile group-hover:rounded-2xl",
          action
            ? "text-decided group-hover:bg-decided group-hover:text-primary-foreground"
            : "text-foreground group-hover:bg-primary group-hover:text-primary-foreground",
        ),
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="group relative flex w-full justify-center">
          <span
            aria-hidden
            className={cn(
              "absolute top-1/2 left-0 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-accent-foreground transition-all",
              active ? "h-10" : "h-0 group-hover:h-5",
            )}
          />
          {href ? (
            <Link href={href} aria-label={label} aria-current={active ? "page" : undefined} className={tile}>
              {children}
            </Link>
          ) : (
            <button type="button" aria-label={label} onClick={onClick} className={tile}>
              {children}
            </button>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-sm font-semibold">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
