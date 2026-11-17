// Defines the private highlight row shape shown on the list page and the channels it can be sent to.
import type { HighlightSend, PrivateHighlight } from "@/types/conversation";
import type { Channel } from "@/types/workspace";

export interface SendTarget {
  id: string;
  name: string;
  myName: string;
  channels: Channel[];
}

/** A private highlight whose dates were formatted on the server. */
export type PrivateHighlightItem = Omit<PrivateHighlight, "sends"> & {
  createdAtLabel: string;
  sends: Array<HighlightSend & { atLabel: string }>;
};

export const FILTER_INPUT_CLASS_NAME =
  "h-8 rounded-md border border-border bg-card px-2.5 text-[13px] shadow-xs outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring";

export function toCollapsedWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Whether the user changed the agent's words rather than only trimming them. */
export function isAgentTextEdited(item: Pick<PrivateHighlightItem, "speakerKind" | "originalText">, text: string): boolean {
  return item.speakerKind === "agent" && !toCollapsedWhitespace(item.originalText).includes(toCollapsedWhitespace(text));
}
