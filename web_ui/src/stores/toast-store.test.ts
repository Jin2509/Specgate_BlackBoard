// Tests queueing, de-duplication and dismissal of toast messages.
import { afterEach, describe, expect, it } from "vitest";

import { dismissToast, listToasts, showErrorToast, showSuccessToast } from "./toast-store";

afterEach(() => {
  for (const toast of listToasts()) dismissToast(toast.id);
});

describe("toast store", () => {
  it("should add a message with its tone", () => {
    showErrorToast("Could not save.");
    expect(listToasts().map((toast) => [toast.tone, toast.text])).toEqual([["error", "Could not save."]]);
  });

  it("should move a repeated message to the front instead of stacking it", () => {
    showErrorToast("Could not save.");
    showSuccessToast("Saved.");
    showErrorToast("Could not save.");
    expect(listToasts().map((toast) => toast.text)).toEqual(["Saved.", "Could not save."]);
  });

  it("should keep only the three newest messages", () => {
    for (const text of ["one", "two", "three", "four"]) showErrorToast(text);
    expect(listToasts().map((toast) => toast.text)).toEqual(["two", "three", "four"]);
  });

  it("should ignore an empty message", () => {
    showErrorToast("");
    expect(listToasts()).toEqual([]);
  });

  it("should remove a dismissed message", () => {
    showErrorToast("Could not save.");
    dismissToast(listToasts()[0].id);
    expect(listToasts()).toEqual([]);
  });
});
