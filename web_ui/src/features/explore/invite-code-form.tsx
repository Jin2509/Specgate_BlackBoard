// Ô dán liên kết hoặc mã mời để vào thẳng một workspace chung.
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openInvite } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";

export function InviteCodeForm({ className }: { className?: string }) {
  return (
    <form action={openInvite} className={cn("flex items-center gap-2 rounded-md bg-input p-1 pl-3", className)}>
      <Link2 className="size-4 shrink-0 text-subtle" />
      <input
        name="invite"
        aria-label="Liên kết hoặc mã mời"
        placeholder="Dán liên kết mời, ví dụ /invite/doan-kc26"
        className="h-8 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
      />
      <Button type="submit" size="sm">
        Tham gia
      </Button>
    </form>
  );
}
