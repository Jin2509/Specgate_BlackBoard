// Logic tìm và chèn gợi ý @ và / cho ô soạn.
import { commandsFor, type CommandSpec } from "@/lib/commands";
import type { Agent, Profile } from "@/lib/types";

export type Suggestion =
  { kind: "agent"; agent: Agent } | { kind: "person"; person: Profile } | { kind: "command"; command: CommandSpec };

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

export function mentionSuggestions(agents: Agent[], people: Profile[], query: string): Suggestion[] {
  return [
    ...agents.filter((a) => a.enabled && a.handle.startsWith(query)).map((agent) => ({ kind: "agent" as const, agent })),
    ...people.filter((p) => p.displayName.toLowerCase().startsWith(query)).map((person) => ({ kind: "person" as const, person })),
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
  return s.command.name;
}

export function applySuggestion(text: string, s: Suggestion): string {
  return text.replace(/([@/])([^\s@/]*)$/, suggestionToken(s)) + " ";
}
