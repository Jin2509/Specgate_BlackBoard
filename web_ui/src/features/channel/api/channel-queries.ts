// Reads the message page of a channel for the current request.
import { cache } from "react";

import { callApi } from "@/lib/api/server-api";
import type { MessagesPage } from "@/types/message";

export const listMessages = cache((workspaceId: string, channelId: string) =>
  callApi<MessagesPage>(`/workspaces/${encodeURIComponent(workspaceId)}/channels/${encodeURIComponent(channelId)}/messages`),
);
