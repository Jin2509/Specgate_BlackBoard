// Renders the home page reached after sign-in and from the logo: the workspace rail, a greeting and the main entries.
import { MessageSquare, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { AccountSwitchGuard } from "@/components/AccountSwitchGuard";
import { requireMe } from "@/features/auth/server";
import { RobotIllustration } from "@/features/home";
import { AccountMenu, ShellSkeleton, WorkspaceRail } from "@/features/workspace";
import { format, t } from "@/lib/i18n";
import { cn } from "@/utils/cn";
import { toPersonalHomePath, toSharedHomePath } from "@/utils/route-paths";

export const metadata: Metadata = { title: t.home.pageTitle };

export default function HomePage() {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Suspense fallback={<ShellSkeleton />}>
        <Home />
      </Suspense>
    </div>
  );
}

async function Home() {
  const me = await requireMe("/");
  const personalWorkspaceId = me.personalWorkspaceId ?? "";
  const personalHome = toPersonalHomePath(personalWorkspaceId);
  const teamPath = me.lastSharedPath ?? (me.workspaces[0] ? toSharedHomePath(me.workspaces[0].id) : null);
  const firstName = me.user.displayName.split(" ").slice(-1)[0];

  return (
    <>
      <AccountSwitchGuard userId={me.user.id} />
      <WorkspaceRail workspaces={me.workspaces} pendingJoins={me.pendingJoins} activeId="" personalId={personalWorkspaceId} />
      <main className="flex min-w-0 flex-1 flex-col bg-canvas">
        <header className="flex h-14 shrink-0 items-center justify-end px-4 sm:px-6">
          <AccountMenu user={me.user} settingsHref={`${personalHome}/key`} settingsLabel={t.workspace.keyAndModel} />
        </header>
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 pt-4 pb-16 text-center">
          <RobotIllustration className="h-48 w-auto sm:h-56" />
          <h1 className="mt-4 text-2xl font-bold text-sidebar-accent-foreground">
            {format(t.home.greeting, { name: firstName })}
          </h1>
          <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">{t.home.lead}</p>
          <div className="mt-6 flex w-full max-w-xl flex-col gap-2.5 sm:flex-row">
            <HomeButton href={me.key ? personalHome : `${personalHome}/key`} icon={<MessageSquare />}>
              {me.key ? t.home.chatWithAgent : t.home.enterKey}
            </HomeButton>
            {teamPath ? (
              <HomeButton href={teamPath} icon={<Users />} isSecondary>
                {t.home.workWithTeam}
              </HomeButton>
            ) : (
              <HomeButton href={`/w/${personalWorkspaceId}/explore`} icon={<Users />} isSecondary>
                {t.home.findTeam}
              </HomeButton>
            )}
          </div>
          {me.workspaces.length === 0 ? <p className="mt-3 text-[13px] text-subtle">{t.home.noTeamHint}</p> : null}
        </div>
      </main>
    </>
  );
}

function HomeButton({
  href,
  icon,
  isSecondary,
  children,
}: {
  href: string;
  icon: ReactNode;
  isSecondary?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-[15px] font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&_svg]:size-4.5",
        isSecondary
          ? "border border-border bg-card text-foreground hover:bg-hover"
          : "bg-primary text-primary-foreground hover:bg-primary-strong",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
