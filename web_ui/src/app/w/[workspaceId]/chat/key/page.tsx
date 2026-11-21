// Sets the personal workspace's API key and model.
import { CircleCheck, KeyRound } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { PageBody } from "@/components/PageBody";
import { PageHeader } from "@/components/PageHeader";
import { PageLayout } from "@/components/PageLayout";
import { requireMe } from "@/features/auth/server";
import { KeySettings } from "@/features/personal";
import { getKeySettings } from "@/features/personal/server";
import { ContentSkeleton } from "@/features/workspace";
import { requirePersonalWorkspace } from "@/features/workspace/server";
import { format, t } from "@/lib/i18n";
import { toContentWidthClassName } from "@/utils/content-width";
import { toDateClock } from "@/utils/date-format";

export const metadata: Metadata = { title: t.workspace.keyAndModel };

const WELCOME_PROVIDERS: Record<string, string> = { github: "GitHub", google: "Google", email: "email" };

export default function KeyPage(props: PageProps<"/w/[workspaceId]/chat/key">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <KeyPageContent {...props} />
    </Suspense>
  );
}

async function KeyPageContent({ params, searchParams }: PageProps<"/w/[workspaceId]/chat/key">) {
  await requirePersonalWorkspace(params);
  const { welcome } = await searchParams;
  const welcomeProvider = typeof welcome === "string" ? WELCOME_PROVIDERS[welcome] : undefined;
  const me = await requireMe();
  const { key, note } = await getKeySettings();

  return (
    <PageLayout>
      <PageHeader icon={<KeyRound />} title={t.workspace.keyAndModel} />
      <PageBody>
        <div className={toContentWidthClassName("wide")}>
          {welcomeProvider && !key ? (
            <p
              role="status"
              className="mb-2 flex items-start gap-2 rounded-lg border border-decided-line bg-decided-soft px-4 py-3 text-sm text-foreground"
            >
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-decided" />
              <span>{format(t.personal.welcomeCreated, { provider: welcomeProvider, name: me.user.displayName })}</span>
            </p>
          ) : null}
          <KeySettings providerKey={key} note={note} savedAtLabel={key ? toDateClock(key.savedAt) : ""} />
        </div>
      </PageBody>
    </PageLayout>
  );
}
