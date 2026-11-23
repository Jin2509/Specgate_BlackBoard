// Tests that drafts are kept per signed-in person and wiped on sign-out.
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { DraftOwnerProvider } from "@/components/DraftOwnerProvider";

import { clearAllDrafts, useDraft } from "./use-draft";

function typeDraft(ownerId: string, text: string, key = "chat:new"): void {
  const { result } = renderDraft(ownerId, key);
  act(() => result.current[1](text));
}

function renderDraft(ownerId: string, key = "chat:new") {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <DraftOwnerProvider ownerId={ownerId}>{children}</DraftOwnerProvider>
  );
  return renderHook(() => useDraft(key), { wrapper });
}

afterEach(() => window.localStorage.clear());

describe("useDraft", () => {
  it("should keep a draft across a reload for the same person", () => {
    typeDraft("u_lan", "Kiem thu hop den");
    expect(renderDraft("u_lan").result.current[0]).toBe("Kiem thu hop den");
  });

  it("should not show a draft to another account in the same browser", () => {
    typeDraft("u_lan", "Kiem thu hop den");
    expect(renderDraft("u_long").result.current[0]).toBe("");
  });

  it("should keep a draft in memory only when the owner is unknown", () => {
    typeDraft("", "secret");
    expect(window.localStorage.length).toBe(0);
  });
});

describe("clearAllDrafts", () => {
  it("should remove every draft and keep other preferences", () => {
    typeDraft("u_lan", "one");
    typeDraft("u_long", "two", "channel:w:c");
    window.localStorage.setItem("sg:sidebar:workspace-nav", "collapsed");
    clearAllDrafts();
    expect(Object.keys(window.localStorage)).toEqual(["sg:sidebar:workspace-nav"]);
  });
});
