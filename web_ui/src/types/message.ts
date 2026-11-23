// Defines channel messages, their text segments, attachments and cards.
import type { BoardItemKind, IdeaStatus } from "./board";
import type { Highlight } from "./highlight";
import type { Profile } from "./profile";
import type { Channel } from "./workspace";

export type SenderKind = "human" | "agent" | "system";

export type Segment = { t: "text"; v: string } | { t: "mention"; v: string } | { t: "command"; v: string };

export type Attachment =
  | { type: "board-receipt"; itemId: string; number: number; kind: BoardItemKind; text: string; status: IdeaStatus | null }
  | { type: "help"; commands: Array<{ usage: string; description: string }> }
  | { type: "brief"; briefId: string }
  | { type: "summary" }
  | {
      type: "document";
      fileName: string;
      mediaType: string;
      sizeBytes: number;
      charCount: number;
      /** The text read from the file, cut at the server's limit when `truncated`. */
      markdown: string;
      truncated: boolean;
    };

export interface QuoteCardBase {
  highlightId: string;
  text: string;
  speaker: string;
  speakerLabel: string;
  speakerKind: "agent" | "human";
  ownerId: string;
  ownerName: string;
  model: string | null;
  agentName: string | null;
  /** The agent's words were changed rather than only cut. */
  edited: boolean;
  /** Cut in the middle of a sentence ("partial quote"); `cutStart`/`cutEnd` place the ellipsis. */
  partial?: boolean;
  cutStart?: boolean;
  cutEnd?: boolean;
  ownerLeft?: boolean;
}

/** Cards are snapshots taken when sent. */
export type Card =
  | (QuoteCardBase & { kind: "quote"; digest?: boolean })
  | (QuoteCardBase & {
      kind: "conversation-summary";
      title: string;
      turns: Array<{ role: "user" | "assistant"; text: string; speaker: string }>;
    });

/** For an agent message, `senderId` is the agent's owner and `agentModel` the model at send time. */
export interface Message {
  id: string;
  seq: number;
  workspaceId: string;
  channelId: string;
  senderKind: SenderKind;
  senderId: string;
  senderName: string;
  sender?: Profile;
  agentModel?: string;
  agentName?: string;
  agentProvider?: string | null;
  at: string;
  body: Segment[];
  text: string;
  replyToId?: string;
  replyTo?: { id: string; speaker: string; text: string };
  attachment?: Attachment;
  cards?: Card[];
}

export interface MessagesPage {
  channel: Channel;
  messages: Message[];
  ownMessageIds: string[];
  myHighlights: Highlight[];
  lastSeq: number | null;
}
