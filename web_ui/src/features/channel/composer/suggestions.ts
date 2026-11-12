// Logic tìm và chèn gợi ý @ và / cho ô soạn. Gợi ý @ gồm agent, người và highlight của chính mình.
import { commandsFor, type CommandSpec } from "@/lib/commands";
import type { Agent, Highlight, Profile } from "@/lib/types";

export type Suggestion =
  | { kind: "agent"; agent: Agent }
  | { kind: "person"; person: Profile }
  | { kind: "highlight"; highlight: Highlight }
  | { kind: "command"; command: CommandSpec };

export type CommandSuggestion = Extract<Suggestion, { kind: "command" }>;

export interface Trigger {
  mode: "@" | "/";
  query: string;
}

export function trailingTrigger(text: string): Trigger | null {
  const m = /(?:^|\s)([@/])([^\s@/]*)$/.exec(text);
  if (!m) return null;
  return { mode: m[1] as Trigger["mode"], query: m[2].toLowerCase() };
}

export function mentionSuggestions(
  agents: Agent[],
  people: Profile[],
  query: string,
  highlights: Highlight[] = [],
): Suggestion[] {
  return [
    ...agents.filter((a) => a.enabled && a.handle.startsWith(query)).map((agent) => ({ kind: "agent" as const, agent })),
    ...people.filter((p) => p.displayName.toLowerCase().startsWith(query)).map((person) => ({ kind: "person" as const, person })),
    ...highlights
      .filter((h) => !query || h.text.toLowerCase().includes(query))
      .map((highlight) => ({ kind: "highlight" as const, highlight })),
  ];
}

export function commandSuggestions(modules: string[], query: string): Suggestion[] {
  return commandsFor(modules)
    .filter((c) => c.name.slice(1).startsWith(query))
    .map((command) => ({ kind: "command" as const, command }));
}

export function suggestionToken(s: Suggestion): string {
  if (s.kind === "agent") return `@${s.agent.handle}`;
  if (s.kind === "person") return `@${s.person.displayName}`;
  if (s.kind === "highlight") return "";
  return s.command.name;
}

// Highlight không chèn chữ vào ô soạn: nó thành thẻ đính kèm, nên chỉ xóa từ @ đang gõ.
export function applySuggestion(text: string, s: Suggestion): string {
  if (s.kind === "highlight") return text.replace(/(^|\s)@[^\s@/]*$/, "$1");
  return text.replace(/([@/])([^\s@/]*)$/, suggestionToken(s)) + " ";
}
