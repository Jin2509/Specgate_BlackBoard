// Explains, next to the sign-in form, how a person gets into a shared workspace.
import { Compass, KeyRound, Lock, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { t } from "@/lib/i18n";

const STEPS: Array<{ icon: ReactNode; title: string; body: string }> = [
  { icon: <Lock />, title: t.auth.guidePersonalTitle, body: t.auth.guidePersonalBody },
  { icon: <KeyRound />, title: t.auth.guideCodeTitle, body: t.auth.guideCodeBody },
  { icon: <ShieldCheck />, title: t.auth.guideApprovalTitle, body: t.auth.guideApprovalBody },
  { icon: <Compass />, title: t.auth.guideExploreTitle, body: t.auth.guideExploreBody },
];

export function JoinGuide() {
  return (
    <div>
      <p className="text-[0.8125rem] font-semibold text-subtle">{t.auth.guideTitle}</p>
      <ol className="mt-4 space-y-4">
        {STEPS.map((step) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-4">
              {step.icon}
            </span>
            <span>
              <span className="block text-sm font-semibold text-sidebar-accent-foreground">{step.title}</span>
              <span className="mt-0.5 block text-[0.8125rem] leading-snug text-subtle">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
