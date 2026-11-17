// Splits a channel selection into passages per message, card and summary turn, each with its speaker and source text.
/** A selected passage; `own` marks the viewer's own message and `source` is the whole text it was cut from. */
export interface SelectedSegment {
  messageId: string;
  channelId: string;
  part: number | null;
  turn?: number | null;
  speaker: string;
  text: string;
  source: string;
  own: boolean;
}

const BLOCK_SELECTOR = "p,li,div,h1,h2,h3,h4,h5,h6,blockquote,pre,tr,td,th";

// Range.toString() glues block lines (li, p) together, so a space is inserted at each block boundary.
function toClippedText(range: Range, el: Element): string {
  const r = document.createRange();
  r.selectNodeContents(el);
  if (range.compareBoundaryPoints(Range.START_TO_START, r) > 0) r.setStart(range.startContainer, range.startOffset);
  if (range.compareBoundaryPoints(Range.END_TO_END, r) < 0) r.setEnd(range.endContainer, range.endOffset);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let out = "";
  let lastBlock: Element | null = null;
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    if (!r.intersectsNode(n)) continue;
    const start = n === r.startContainer ? r.startOffset : 0;
    const end = n === r.endContainer ? r.endOffset : n.data.length;
    const block = n.parentElement?.closest(BLOCK_SELECTOR) ?? null;
    if (lastBlock && block !== lastBlock) out += " ";
    out += n.data.slice(start, end);
    lastBlock = block;
  }
  return out.replace(/\s+/g, " ").trim();
}

/** One line per block (paragraph, list item), the same text the backend matches against. */
function toBlockText(el: Element): string {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let out = "";
  let lastBlock: Element | null = null;
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const block = n.parentElement?.closest(BLOCK_SELECTOR) ?? null;
    if (lastBlock && block !== lastBlock) out += "\n";
    out += n.data;
    lastBlock = block;
  }
  return out.trim();
}

export function listSelectedSegments(range: Range, box: HTMLElement): SelectedSegment[] {
  const out: SelectedSegment[] = [];
  for (const msg of Array.from(box.querySelectorAll<HTMLElement>("[data-message-id]"))) {
    if (!range.intersectsNode(msg)) continue;
    const own = msg.dataset.own === "true";
    const body = msg.querySelector<HTMLElement>("[data-part-body]");
    if (body && range.intersectsNode(body)) {
      const text = toClippedText(range, body);
      if (text)
        out.push({
          messageId: msg.dataset.messageId!,
          channelId: msg.dataset.channelId!,
          part: null,
          speaker: msg.dataset.speaker ?? "",
          text,
          source: toBlockText(body),
          own,
        });
    }
    for (const partEl of Array.from(msg.querySelectorAll<HTMLElement>("[data-part]"))) {
      const textEl = partEl.querySelector<HTMLElement>("[data-part-text]");
      if (textEl && range.intersectsNode(textEl)) {
        const text = toClippedText(range, textEl);
        if (text)
          out.push({
            messageId: msg.dataset.messageId!,
            channelId: msg.dataset.channelId!,
            part: Number(partEl.dataset.part),
            speaker: partEl.dataset.partSpeaker ?? msg.dataset.speaker ?? "",
            text,
            source: toBlockText(textEl),
            own,
          });
      }
      // An original turn attached to a summary keeps the speaker of that turn, not of the summary.
      for (const turnEl of Array.from(partEl.querySelectorAll<HTMLElement>("[data-turn]"))) {
        const turnText = turnEl.querySelector<HTMLElement>("[data-turn-text]") ?? turnEl;
        if (!range.intersectsNode(turnText)) continue;
        const text = toClippedText(range, turnText);
        if (text)
          out.push({
            messageId: msg.dataset.messageId!,
            channelId: msg.dataset.channelId!,
            part: Number(partEl.dataset.part),
            turn: Number(turnEl.dataset.turn),
            speaker: turnEl.dataset.turnSpeaker ?? "",
            text,
            source: toBlockText(turnText),
            own,
          });
      }
    }
  }
  return out;
}

function toCollapsedWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Whether the edited passage only trims the original: it must stay a contiguous part of the selection. */
export function isNarrowing(original: string, next: string): boolean {
  const collapsed = toCollapsedWhitespace(next);
  return collapsed.length > 0 && toCollapsedWhitespace(original).includes(collapsed);
}
