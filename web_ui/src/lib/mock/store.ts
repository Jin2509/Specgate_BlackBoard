// Kho dữ liệu giả có thể ghi, sống trong tiến trình máy chủ (thay cho Supabase cho tới F03).
// Đặt trên globalThis để mọi route, server action và lần nạp lại nóng dùng chung một bản.
import type {
  BoardItem,
  Conversation,
  Highlight,
  JoinCode,
  JoinRequest,
  Message,
  OAuthAccount,
  Profile,
  ProviderKey,
  Workspace,
} from "@/lib/types";
import {
  boards,
  conversations,
  highlights,
  joinCodes,
  joinRequests,
  messages,
  oauthAccounts,
  profiles,
  providerKeys,
  workspaces,
} from "./data";

export interface MockStore {
  profiles: Record<string, Profile>;
  oauthAccounts: OAuthAccount[];
  workspaces: Record<string, Workspace>;
  boards: Record<string, BoardItem[]>;
  messages: Record<string, Message[]>;
  joinRequests: JoinRequest[];
  joinCodes: JoinCode[];
  providerKeys: ProviderKey[];
  conversations: Conversation[];
  highlights: Highlight[];
  seq: number;
}

function seed(): MockStore {
  return {
    profiles: structuredClone(profiles),
    oauthAccounts: structuredClone(oauthAccounts),
    workspaces: structuredClone(workspaces),
    boards: structuredClone(boards),
    messages: structuredClone(messages),
    joinRequests: structuredClone(joinRequests),
    joinCodes: structuredClone(joinCodes),
    providerKeys: structuredClone(providerKeys),
    conversations: structuredClone(conversations),
    highlights: structuredClone(highlights),
    seq: 0,
  };
}

const KEY = "__specgateMockStore_v4";
const g = globalThis as typeof globalThis & { [KEY]?: MockStore };

export function store(): MockStore {
  return (g[KEY] ??= seed());
}

// Chỉ dùng trong test: đưa kho về dữ liệu ban đầu.
export function resetStore() {
  g[KEY] = seed();
}

export function nextId(prefix: string): string {
  const s = store();
  s.seq += 1;
  return `${prefix}${Date.now().toString(36)}${s.seq}`;
}

export function nowLabel(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function clockLabel(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
