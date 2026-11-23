"use client";
// Keeps a text draft in browser storage, per signed-in person, so it survives a reload or a lost connection.
import { useCallback, useContext, useState } from "react";

import { DraftOwnerContext } from "@/components/DraftOwnerProvider";

const STORAGE_PREFIX = "sg:draft:";

function readDraft(storageKey: string): string {
  try {
    return window.localStorage.getItem(storageKey) ?? "";
  } catch {
    // Storage can be blocked (private window); the draft then simply starts empty.
    return "";
  }
}

function writeDraft(storageKey: string, text: string): void {
  try {
    if (text) window.localStorage.setItem(storageKey, text);
    else window.localStorage.removeItem(storageKey);
  } catch {
    // Storage can be blocked (private window); the draft then lives only in memory.
  }
}

/** Remove every draft kept in this browser, whoever typed it; called on sign-out. */
export function clearAllDrafts(): void {
  try {
    const keys = Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index));
    for (const key of keys) if (key?.startsWith(STORAGE_PREFIX)) window.localStorage.removeItem(key);
  } catch {
    // Storage can be blocked (private window); there is then nothing kept to remove.
  }
}

export function useDraft(key: string): [string, (text: string) => void] {
  const ownerId = useContext(DraftOwnerContext);
  // Without a known owner the draft stays in memory only: it must never be read by another account.
  const storageKey = ownerId ? `${STORAGE_PREFIX}${ownerId}:${key}` : null;
  const [draft, setDraft] = useState(() => (typeof window === "undefined" || !storageKey ? "" : readDraft(storageKey)));
  const updateDraft = useCallback(
    (text: string) => {
      setDraft(text);
      if (storageKey) writeDraft(storageKey, text);
    },
    [storageKey],
  );
  return [draft, updateDraft];
}
