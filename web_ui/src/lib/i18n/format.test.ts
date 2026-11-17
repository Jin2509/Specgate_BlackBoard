// Tests placeholder formatting and parity between the locale catalogs.
import { describe, expect, it } from "vitest";

import englishCatalog from "@/locales/en.json";
import vietnameseCatalog from "@/locales/vi.json";

import { format } from "./index";

function toKeys(node: object, prefix = ""): string[] {
  return Object.entries(node).flatMap(([key, value]) =>
    typeof value === "object" && value !== null ? toKeys(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

describe("format", () => {
  it("should replace known placeholders and keep unknown ones", () => {
    expect(format("{name} has {count} items, {missing}", { name: "Lan", count: 2 })).toBe("Lan has 2 items, {missing}");
  });
});

describe("locale catalogs", () => {
  it("should define the same keys in every locale", () => {
    expect(toKeys(englishCatalog).sort()).toEqual(toKeys(vietnameseCatalog).sort());
  });
});
