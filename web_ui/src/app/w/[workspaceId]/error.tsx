"use client";
// Shows a recovery card when a workspace page fails to render, so the rail and the user's drafts stay reachable.
import { useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";

export default function WorkspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div role="alert" className="mx-auto mt-16 max-w-md px-4 text-center">
      <h1 className="text-xl font-semibold text-sidebar-accent-foreground">{t.common.pageErrorTitle}</h1>
      <p className="mt-2 text-[0.9375rem] text-muted-foreground">{t.common.pageErrorBody}</p>
      <Button className="mt-6" onClick={reset}>
        {t.common.pageErrorRetry}
      </Button>
    </div>
  );
}
