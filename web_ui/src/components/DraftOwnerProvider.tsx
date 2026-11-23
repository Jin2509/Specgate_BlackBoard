"use client";
// Tells the draft hook whose drafts it keeps, so a person never sees text typed by another account in this browser.
import { createContext, type ReactNode } from "react";

export const DraftOwnerContext = createContext("");

export function DraftOwnerProvider({ ownerId, children }: { ownerId: string; children: ReactNode }) {
  return <DraftOwnerContext.Provider value={ownerId}>{children}</DraftOwnerContext.Provider>;
}
