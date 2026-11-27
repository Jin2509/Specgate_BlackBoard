// Renders the 404 page for a missing workspace, channel, join request or page.
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { AuthScreen } from "@/features/auth";
import { t } from "@/lib/i18n";

export default function NotFound() {
  return (
    <AuthScreen className="max-w-120 text-center">
      <p className="font-mono text-sm text-subtle">404</p>
      <h1 className="mt-1 text-2xl font-semibold text-sidebar-accent-foreground">{t.common.notFoundTitle}</h1>
      <p className="mt-2 text-[0.9375rem] text-muted-foreground">{t.common.notFoundWorkspaceBody}</p>
      <Button asChild className="mt-6 h-11 w-full text-base">
        <Link href="/" prefetch={false}>
          {t.common.backToYourPage}
        </Link>
      </Button>
    </AuthScreen>
  );
}
