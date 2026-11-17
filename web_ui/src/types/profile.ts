// Defines the public profile of a person as returned by the backend.
export type AuthProvider = "github" | "google";

/** Inside a shared workspace, `displayName` is the unique workspace name and `account` the masked sign-in account. */
export interface Profile {
  id: string;
  displayName: string;
  initial: string;
  color?: number;
  accountName?: string;
  account?: string | null;
  /** The person left the workspace; `displayName` already says so and keeps their place. */
  left?: boolean;
}
