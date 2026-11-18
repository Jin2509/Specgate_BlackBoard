// Finds and inserts the @ and / suggestions of the composer; @ offers people and "My highlights", never an agent.
import { t } from "@/lib/i18n";
import type { Profile } from "@/types/profile";

import { COMMANDS, type CommandSpec } from "./commands";

export type Suggestion = { kind: "person"; person: Profile } | { kind: "command"; command: CommandSpec } | { kind: "highlights" };

export type CommandSuggestion = Extract<Suggestion, { kind: "command" }>;

export interface Trigger {
  mode: "@" | "/";
  query: string;
}

const TRAILING_TRIGGER = /(?:^|\s)([@/])([^\s@/]*)$/;
const TRAILING_TOKEN = /([@/])([^\s@/]*)$/;

export function toTrailingTrigger(text: string): Trigger | null {
  const match = TRAILING_TRIGGER.exec(text);
  if (!match) return null;
  return { mode: match[1] as Trigger["mode"], query: match[2].toLowerCase() };
}

export function listMentionSuggestions(people: Profile[], query: string): Suggestion[] {
  return people
    .filter((person) => person.displayName.toLowerCase().startsWith(query))
    .map((person) => ({ kind: "person" as const, person }));
}

/** Put "My highlights" first when the query still matches one of its aliases, then the matching people. */
export function listMentionSuggestionsWithHighlights(people: Profile[], query: string): Suggestion[] {
  const persons = listMentionSuggestions(people, query);
  const matchesHighlights = !query || t.channel.highlightSearchAliases.some((alias) => alias.startsWith(query));
  return matchesHighlights ? [{ kind: "highlights" }, ...persons] : persons;
}

export function listCommandSuggestions(query: string): Suggestion[] {
  return COMMANDS.filter((command) => command.name.slice(1).startsWith(query)).map((command) => ({
    kind: "command" as const,
    command,
  }));
}

export function toSuggestionToken(suggestion: Suggestion): string {
  if (suggestion.kind === "highlights") return "";
  return suggestion.kind === "person" ? `@${suggestion.person.displayName}` : suggestion.command.name;
}

export function toTextWithSuggestion(text: string, suggestion: Suggestion): string {
  if (suggestion.kind === "highlights") return text.replace(TRAILING_TOKEN, "");
  return `${text.replace(TRAILING_TOKEN, toSuggestionToken(suggestion))} `;
}
