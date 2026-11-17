// Tests building the /decide command shown in the decision dialog.
import { describe, expect, it } from "vitest";

import { t } from "@/lib/i18n";

import { toDecideCommand } from "./decide-command";

describe("toDecideCommand", () => {
  it("should shorten a long reason and use the verb of the decision", () => {
    expect(toDecideCommand(4, "rejected", "The library is already well tested and hard to measure")).toBe(
      `/decide #4 ${t.board.commandReject} The library is already well…`,
    );
    expect(toDecideCommand(3, "decided", "Fits in 3 weeks")).toBe(`/decide #3 ${t.board.commandDecide} Fits in 3 weeks`);
  });

  it("should leave no trailing space when the reason is blank", () => {
    expect(toDecideCommand(2, "decided", "  ")).toBe(`/decide #2 ${t.board.commandDecide}`);
  });
});
