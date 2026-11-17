// Accepts a post-login destination only when it is an in-app path, never another origin.
export function toSafeNextPath(next: unknown): string | undefined {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
}
