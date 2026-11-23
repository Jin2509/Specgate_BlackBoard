// Tests turning backend error codes into catalog sentences.
import { describe, expect, it } from "vitest";

import { t } from "@/lib/i18n";

import { toErrorText } from "./error-text";

const FALLBACK = "fallback";

describe("toErrorText", () => {
  it("should map a provider code from the key check to the catalog sentence", () => {
    expect(toErrorText("KEY_INVALID_KEY", "raw backend text", FALLBACK)).toBe(t.errors.invalidKey);
  });

  it("should map a lowercase provider code from the chat stream", () => {
    expect(toErrorText("bad-url", "raw backend text", FALLBACK)).toBe(t.errors.badUrl);
  });

  it("should map a provider code from a summary call", () => {
    expect(toErrorText("PROVIDER_QUOTA", "raw backend text", FALLBACK)).toBe(t.errors.quota);
  });

  it("should keep the backend message for a code without a catalog sentence", () => {
    expect(toErrorText("TASK_TAKEN", "Task 3 already has an owner.", FALLBACK)).toBe("Task 3 already has an owner.");
  });

  it("should replace a framework status message with the catalog sentence", () => {
    expect(toErrorText("HTTP_404", "Not Found", FALLBACK)).toBe(t.errors.notFound);
  });

  it("should use the generic server sentence for an unknown server status", () => {
    expect(toErrorText("HTTP_502", "Bad Gateway", FALLBACK)).toBe(t.errors.backendFailed);
  });

  it("should use the fallback when there is neither a known code nor a message", () => {
    expect(toErrorText(undefined, "", FALLBACK)).toBe(FALLBACK);
  });
});
