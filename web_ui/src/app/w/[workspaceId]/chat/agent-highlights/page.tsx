// Lists the passages the user highlighted in other people's channel messages, grouped by workspace, for their agent.
import { Bot, Hash, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageBody } from "@/components/PageBody";
import { PageHeader } from "@/components/PageHeader";
import { PageLayout } from "@/components/PageLayout";
import { AgentHighlightNote, deleteHighlight, HighlightQuote } from "@/features/highlight";
import { listHighlights } from "@/features/highlight/server";
import { ContentSkeleton } from "@/features/workspace";
import { requirePersonalWorkspace } from "@/features/workspace/server";
import { format, t } from "@/lib/i18n";
import { toContentWidthClassName } from "@/utils/content-width";
import { toDayClock } from "@/utils/date-format";
import { listSegmentNotices, toEllipsizedText, toSegmentsText } from "@/utils/excerpt";
import { toSharedHomePath } from "@/utils/route-paths";
import { startEarly } from "@/utils/start-early";

export const metadata: Metadata = { title: t.personal.agentHighlights };

export default function AgentHighlightsPage(props: PageProps<"/w/[workspaceId]/chat/agent-highlights">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <AgentHighlightsContent {...props} />
    </Suspense>
  );
}

async function AgentHighlightsContent({ params }: PageProps<"/w/[workspaceId]/chat/agent-highlights">) {
  const pendingHighlights = startEarly(listHighlights());
  await requirePersonalWorkspace(params);
  const { groups, total, limit } = await pendingHighlights;

  return (
    <PageLayout>
      <PageHeader
        icon={<Bot />}
        title={t.personal.agentHighlights}
        meta={format(t.personal.agentHighlightsMeta, { count: total })}
      />
      <PageBody>
        <div className={toContentWidthClassName("reading")}>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            {format(t.personal.agentHighlightsIntro, { limit })}
          </p>

          {groups.map((group) => (
            <section key={group.workspaceId} className="mt-6">
              <h2 className="flex items-center gap-2 text-[13px] font-semibold text-subtle">
                <Link href={toSharedHomePath(group.workspaceId)} className="hover:text-foreground hover:underline">
                  {group.workspaceName ?? group.workspaceId}
                </Link>
                <span className={group.count >= group.limit ? "text-rejected" : "font-normal"}>
                  {group.count}/{group.limit}
                </span>
              </h2>
              <ul className="mt-2 space-y-3">
                {group.highlights.map((highlight) => (
                  <li key={highlight.id}>
                    <HighlightQuote
                      className="max-w-none"
                      text={toSegmentsText(highlight.segments)}
                      label={highlight.label}
                      notices={listSegmentNotices(highlight.segments)}
                      byline={
                        <>
                          <span className="font-medium text-muted-foreground">{highlight.speaker}</span> {t.personal.said} ·{" "}
                          <Link
                            href={`/w/${group.workspaceId}/c/${highlight.channelId}`}
                            className="inline-flex items-center hover:underline"
                          >
                            <Hash className="size-3" />
                            {highlight.channelName ?? highlight.channelId}
                          </Link>{" "}
                          · {toDayClock(highlight.sourceAt)}
                        </>
                      }
                      actions={
                        <form action={deleteHighlight}>
                          <input type="hidden" name="highlightId" value={highlight.id} />
                          <button
                            type="submit"
                            aria-label={t.personal.removeHighlight}
                            className="inline-flex size-6 items-center justify-center rounded text-subtle hover:bg-hover hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </form>
                      }
                    />
                    {highlight.segments.length > 1 ? (
                      <ul className="mt-1 ml-3 space-y-0.5 text-xs text-subtle">
                        {highlight.segments.map((segment, index) => (
                          <li key={index}>
                            <span className="font-medium text-muted-foreground">
                              {segment.speaker}
                              {segment.partial ? t.channel.partialTag : ""}:
                            </span>{" "}
                            {toEllipsizedText(segment.text, segment)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <AgentHighlightNote id={highlight.id} note={highlight.note} label={highlight.label} />
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {total === 0 ? (
            <p className="mt-6 rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-subtle">
              {t.personal.agentHighlightsEmpty}
            </p>
          ) : null}
        </div>
      </PageBody>
    </PageLayout>
  );
}
