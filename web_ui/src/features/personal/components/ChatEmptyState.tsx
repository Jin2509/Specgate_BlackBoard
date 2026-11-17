// Welcomes the user to an empty private conversation.
import { t } from "@/lib/i18n";

export function ChatEmptyState({ model }: { model: string }) {
  return (
    <div className="mt-auto mb-8 max-w-lg">
      <h2 className="text-xl font-semibold text-sidebar-accent-foreground">{t.personal.emptyTitle}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
        {t.personal.emptyBodyBefore} <span className="font-mono text-[13.5px] text-agent">{model}</span>{" "}
        {t.personal.emptyBodyAfter}
      </p>
    </div>
  );
}
