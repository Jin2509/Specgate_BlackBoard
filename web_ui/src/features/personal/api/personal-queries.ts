// Reads the personal workspace data: key settings, conversations, agent context and private highlights.
import { cache } from "react";

import { callApi } from "@/lib/api/server-api";
import type { KeySettings } from "@/types/agent";
import type { Conversation, ConversationSummary, PrivateHighlightList } from "@/types/conversation";
import type { ContextResponse } from "@/types/highlight";

function toConversationPath(conversationId: string): string {
  return `/conversations/${encodeURIComponent(conversationId)}`;
}

export const getKeySettings = cache(() => callApi<KeySettings>("/me/key"));

export const listConversations = cache(() => callApi<ConversationSummary[]>("/conversations"));

export const getConversation = cache((conversationId: string) => callApi<Conversation>(toConversationPath(conversationId)));

export const getAgentContext = cache((conversationId: string) =>
  callApi<ContextResponse>(`${toConversationPath(conversationId)}/context`),
);

export const listPrivateHighlights = cache((filters: { color?: string; conversationId?: string; kind?: string } = {}) =>
  callApi<PrivateHighlightList>("/private-highlights", { query: filters }),
);
