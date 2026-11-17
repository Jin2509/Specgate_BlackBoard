// Tests the @ and / suggestion logic of the channel composer.
import { describe, expect, it } from "vitest";

import type { Profile } from "@/types/profile";

import {
  listCommandSuggestions,
  listMentionSuggestions,
  listMentionSuggestionsWithHighlights,
  toTextWithSuggestion,
  toTrailingTrigger,
} from "./suggestions";

const people: Profile[] = [
  { id: "lan", displayName: "Lan", initial: "L" },
  { id: "long", displayName: "Long", initial: "L" },
];

describe("toTrailingTrigger", () => {
  it.each([
    ["@lo", { mode: "@", query: "lo" }],
    ["ask @", { mode: "@", query: "" }],
    ["/de", { mode: "/", query: "de" }],
    ["see a/b", null],
    ["email a@b", null],
    ["", null],
  ])("should read %j", (input, expected) => {
    expect(toTrailingTrigger(input)).toEqual(expected);
  });
});

describe("suggestion lists", () => {
  it("should suggest only people filtered by name prefix", () => {
    const names = listMentionSuggestions(people, "lo").map((suggestion) =>
      suggestion.kind === "person" ? suggestion.person.displayName : "",
    );
    expect(names).toEqual(["Long"]);
    expect(listMentionSuggestions(people, "").every((suggestion) => suggestion.kind === "person")).toBe(true);
  });

  it("should put My highlights first while the query matches it", () => {
    expect(listMentionSuggestionsWithHighlights(people, "")[0]).toEqual({ kind: "highlights" });
    expect(listMentionSuggestionsWithHighlights(people, "hi")[0]).toEqual({ kind: "highlights" });
    expect(listMentionSuggestionsWithHighlights(people, "lo").some((suggestion) => suggestion.kind === "highlights")).toBe(false);
    expect(toTextWithSuggestion("see @hi", { kind: "highlights" })).toBe("see ");
  });

  it("should leave module commands out of a workspace without ADOM", () => {
    const names = listCommandSuggestions([], "").map((suggestion) =>
      suggestion.kind === "command" ? suggestion.command.name : "",
    );
    expect(names).not.toContain("/stats");
  });

  it("should replace the trailing token and add a space", () => {
    const [decide] = listCommandSuggestions([], "de");
    expect(toTextWithSuggestion("Lan, /de", decide)).toBe("Lan, /decide ");
    const [long] = listMentionSuggestions(people, "lo");
    expect(toTextWithSuggestion("ask @lo", long)).toBe("ask @Long ");
  });
});
