// Tests the input-method check that keeps Enter from sending half-typed Vietnamese words.
import { describe, expect, it } from "vitest";

import { isImeComposing } from "./ime-composition";

describe("isImeComposing", () => {
  it("should treat Enter as composing while the input method reports it", () => {
    expect(isImeComposing({ isComposing: true, keyCode: 13 })).toBe(true);
  });

  it("should catch Safari's confirming Enter, which arrives with isComposing already false", () => {
    expect(isImeComposing({ isComposing: false, keyCode: 229 })).toBe(true);
  });

  it("should let a plain Enter through", () => {
    expect(isImeComposing({ isComposing: false, keyCode: 13 })).toBe(false);
  });
});
