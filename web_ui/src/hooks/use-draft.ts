"use client";
// Keeps a text draft in browser storage so it survives a reload or a lost connection.
import { useCallback, useState } from "react";

const STORAGE_PREFIX = "sg:draft:";

function readDraft(key: string): string {
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + key) ?? "";
  } catch {
    // Storage can be blocked (private window); the draft then simply starts empty.
    return "";
  }
}

function writeDraft(key: string, text: string): void {
  try {
    if (text) window.localStorage.setItem(STORAGE_PREFIX + key, text);
    else window.localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // Storage can be blocked (private window); the draft then lives only in memory.
  }
}

export function useDraft(key: string): [string, (text: string) => void] {
  const [draft, setDraft] = useState(() => (typeof window === "undefined" ? "" : readDraft(key)));
  const updateDraft = useCallback(
    (text: string) => {
      setDraft(text);
      writeDraft(key, text);
    },
    [key],
  );
  return [draft, updateDraft];
}
