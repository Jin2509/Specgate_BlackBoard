// Renders the cards of a channel message (quote, conversation summary, metrics, task), each a snapshot taken at send time.
import { ChevronRight, ExternalLink, FlaskConical, ListCollapse, Quote, Table2, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { ActorAvatar } from "@/components/ActorAvatar";
import { Markdown } from "@/components/Markdown";
import { ToneBadge } from "@/components/ToneBadge";
import { format, t } from "@/lib/i18n";
import type { Card } from "@/types/message";
import type { Verdict } from "@/types/run";
import { toAvatarColor } from "@/utils/avatar-color";
import { cn } from "@/utils/cn";
import { VERDICT_META } from "@/utils/status-meta";
import { TONE_CLASSES } from "@/utils/tone";

export function MessageCards({ cards, workspaceId, ownerColor }: { cards: Card[]; workspaceId: string; ownerColor?: number }) {
  return (
    <div className="mt-1.5 space-y-2">
      {cards.map((card, index) => (
        // data-part tells the selection which card a passage came from, so the highlight keeps the right speaker.
        <div key={index} data-part={index} data-part-speaker={toPartSpeaker(card)}>
          <CardView card={card} workspaceId={workspaceId} ownerColor={ownerColor} />
        </div>
      ))}
    </div>
  );
}

/** Speaker of a passage selected inside a card, as the backend records it; a summary is the agent's retelling. */
export function toPartSpeaker(card: Card): string {
  if (card.kind === "quote") return card.speakerLabel;
  if (card.kind === "conversation-summary") return format(t.channel.summarySpeaker, { speaker: card.speaker });
  return format(t.channel.statsSpeaker, { run: card.run.name });
}

/** The "…" of a cut sits outside data-part-text so it never ends up inside the highlighted text. */
function CutMark({ isShown }: { isShown?: boolean }) {
  return isShown ? (
    <span aria-hidden data-no-select className="text-subtle select-none">
      …
    </span>
  ) : null;
}

function CardView({ card, workspaceId, ownerColor }: { card: Card; workspaceId: string; ownerColor?: number }) {
  const tint = toAvatarColor(ownerColor);
  switch (card.kind) {
    case "quote":
      return (
        <figure className="max-w-2xl rounded-r-md border-l-4 bg-card py-2 pr-3 pl-3" style={{ borderColor: tint }}>
          <figcaption className="mb-1 flex items-center gap-1.5 text-xs" data-no-select>
            {card.speakerKind === "agent" ? (
              <ActorAvatar kind="agent" initial={card.ownerName} colorIndex={ownerColor} size="xs" />
            ) : (
              <Quote className="size-3.5 text-subtle" />
            )}
            <span className="font-medium text-agent" style={{ color: tint }}>
              {format(t.channel.says, { speaker: card.speakerLabel })}
            </span>
            {card.model ? <span className="font-mono text-subtle">{card.model}</span> : null}
            {card.digest ? <span className="text-subtle">{t.channel.oldMessagesDigest}</span> : null}
          </figcaption>
          <blockquote className="text-[14.5px] leading-relaxed whitespace-pre-line text-foreground">
            <CutMark isShown={card.cutStart} />
            <span data-part-text>{card.text}</span>
            <CutMark isShown={card.cutEnd} />
          </blockquote>
          {card.partial ? (
            <p className="mt-1 text-xs text-subtle" data-no-select>
              {t.channel.partialCut}
            </p>
          ) : null}
        </figure>
      );
    case "conversation-summary":
      return (
        <section className="max-w-2xl rounded-md border border-insufficient-line bg-insufficient-soft/40 p-3">
          <header className="flex flex-wrap items-center gap-1.5 text-xs" data-no-select>
            <ListCollapse className="size-4 text-insufficient" />
            <span className="font-semibold text-insufficient">{card.title}</span>
            <span className="text-subtle">{format(t.channel.summaryByline, { speaker: card.speakerLabel })}</span>
          </header>
          <div data-part-text className="mt-1.5 text-[14px]">
            <Markdown text={card.text} />
          </div>
          {card.turns.length ? (
            <details className="mt-2 text-[13px]">
              <summary className="flex cursor-pointer items-center gap-1 text-subtle hover:text-foreground" data-no-select>
                <ChevronRight className="size-3.5" /> {format(t.channel.originalTurns, { count: card.turns.length })}
              </summary>
              <ol className="mt-1.5 space-y-1.5 border-l-2 border-border pl-3">
                {card.turns.map((turn, index) => (
                  // A selected original turn is credited to that turn's speaker, not to the summary.
                  <li key={index} data-turn={index} data-turn-speaker={turn.speaker}>
                    <span className="font-medium text-muted-foreground" data-no-select>
                      {turn.speaker}:{" "}
                    </span>
                    <span data-turn-text className="whitespace-pre-line">
                      {turn.text}
                    </span>
                  </li>
                ))}
              </ol>
            </details>
          ) : null}
        </section>
      );
    case "stats":
      return <StatsCard card={card} workspaceId={workspaceId} />;
    case "task":
      return (
        <div className="max-w-lg rounded border-l-4 border-data bg-card p-3 text-[13px]">
          <p className="flex items-center gap-1.5 text-xs font-medium text-data" data-no-select>
            <Table2 className="size-3.5" /> {format(t.channel.taskCard, { task: card.task.taskId, run: card.run.name })}
          </p>
          <p data-part-text className="mt-1.5">
            {card.line}
          </p>
          <CardNotice text={card.notice} />
        </div>
      );
  }
}

function CardNotice({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rejected" data-no-select>
      <TriangleAlert className="size-3.5" /> {text}
    </p>
  );
}

function StatsCard({ card, workspaceId }: { card: Extract<Card, { kind: "stats" }>; workspaceId: string }) {
  const isInvalid = card.run.validity !== "valid";
  const toVerdictCount = (verdict: Verdict) => card.criteria.filter((criterion) => criterion.verdict === verdict).length;
  return (
    <div className="max-w-2xl rounded border-l-4 border-data bg-card p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs" data-no-select>
        <FlaskConical className="size-3.5 text-data" />
        <span className="font-medium text-data">
          {format(t.channel.statsHeading, { run: card.run.name, dataset: card.run.dataset, count: card.run.tasks })}
        </span>
        {card.run.kind === "trial" ? <ToneBadge tone="neutral">{t.channel.trial}</ToneBadge> : null}
        {isInvalid ? (
          <ToneBadge tone="rejected" className="ml-auto">
            <TriangleAlert /> {t.channel.invalid}
          </ToneBadge>
        ) : (
          <ToneBadge tone="decided" className="ml-auto">
            {t.channel.valid}
          </ToneBadge>
        )}
      </div>
      {isInvalid && card.run.invalidReason ? (
        <p className="mt-1 text-xs text-rejected" data-no-select>
          {format(t.channel.doNotConclude, { reason: card.run.invalidReason })}
        </p>
      ) : null}
      <ul data-part-text className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {card.criteria.map((criterion, index) => (
          // data-snap="line": a selection inside a criterion line takes the whole line, value and verdict together.
          <li key={criterion.number} data-snap="line" className="rounded bg-input px-2 py-1.5 text-[12.5px] leading-snug">
            <span
              className={cn("mr-1 inline-block size-2 rounded-full", TONE_CLASSES[VERDICT_META[criterion.verdict].tone].bar)}
              aria-hidden
            />
            {card.lines[index]}
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center text-xs text-subtle" data-no-select>
        {format(t.channel.statsCounts, {
          pass: toVerdictCount("PASS"),
          insufficient: toVerdictCount("INSUFFICIENT_DATA"),
          fail: toVerdictCount("FAIL"),
        })}
        <Link
          href={`/w/${workspaceId}/metrics?run=${card.run.id}`}
          className="ml-auto inline-flex items-center gap-1 font-medium text-primary-strong hover:underline"
        >
          <ExternalLink className="size-3" /> {t.channel.openMetrics}
        </Link>
      </div>
      <CardNotice text={card.notice} />
    </div>
  );
}
