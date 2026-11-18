// Renders the cards of a channel message (quote, conversation summary), each a snapshot taken at send time.
import { ChevronRight, ListCollapse, Quote } from "lucide-react";

import { ActorAvatar } from "@/components/ActorAvatar";
import { Markdown } from "@/components/Markdown";
import { format, t } from "@/lib/i18n";
import type { Card } from "@/types/message";
import { toAvatarColor } from "@/utils/avatar-color";

export function MessageCards({ cards, ownerColor }: { cards: Card[]; ownerColor?: number }) {
  return (
    <div className="mt-1.5 space-y-2">
      {cards.map((card, index) => (
        // data-part tells the selection which card a passage came from, so the highlight keeps the right speaker.
        <div key={index} data-part={index} data-part-speaker={toPartSpeaker(card)}>
          <CardView card={card} ownerColor={ownerColor} />
        </div>
      ))}
    </div>
  );
}

/** Speaker of a passage selected inside a card, as the backend records it; a summary is the agent's retelling. */
export function toPartSpeaker(card: Card): string {
  if (card.kind === "quote") return card.speakerLabel;
  return format(t.channel.summarySpeaker, { speaker: card.speaker });
}

/** The "…" of a cut sits outside data-part-text so it never ends up inside the highlighted text. */
function CutMark({ isShown }: { isShown?: boolean }) {
  return isShown ? (
    <span aria-hidden data-no-select className="text-subtle select-none">
      …
    </span>
  ) : null;
}

function CardView({ card, ownerColor }: { card: Card; ownerColor?: number }) {
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
  }
}
