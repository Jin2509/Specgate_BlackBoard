// Tests that a request started early keeps its result and error for the later await.
import { describe, expect, it } from "vitest";

import { startEarly } from "./start-early";

describe("startEarly", () => {
  it("should resolve to the same value when awaited later", async () => {
    const pending = startEarly(Promise.resolve(42));
    await Promise.resolve();
    await expect(pending).resolves.toBe(42);
  });

  it("should still reject when awaited later", async () => {
    const pending = startEarly(Promise.reject(new Error("backend down")));
    await new Promise((resolve) => setTimeout(resolve, 0));
    await expect(pending).rejects.toThrow("backend down");
  });
});
