// Tên cookie phiên đăng nhập giả lập và các hàm đọc/ghi giá trị của chúng.
export const SESSION_COOKIES = {
  user: "sg_uid",
  onboarded: "sg_onboarded",
  joined: "sg_joined",
  last: "sg_last",
} as const;

export const COOKIE_OPTIONS = { path: "/", httpOnly: true, sameSite: "lax" as const, maxAge: 60 * 60 * 24 * 30 };

export function splitList(value: string | undefined): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export function addToList(value: string | undefined, item: string): string {
  const list = splitList(value);
  return list.includes(item) ? list.join(",") : [...list, item].join(",");
}

export function joinedOf(value: string | undefined, userId: string): string[] {
  return splitList(value)
    .map((pair) => pair.split(":"))
    .filter(([uid, ws]) => uid === userId && ws)
    .map(([, ws]) => ws);
}

export function safeNext(next: unknown): string | undefined {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
}

export function inviteCodeFrom(input: string): string | undefined {
  const text = input.trim();
  if (!text) return undefined;
  const fromUrl = /\/invite\/([\w-]+)/.exec(text)?.[1];
  return fromUrl ?? (/^[\w-]+$/.test(text) ? text : undefined);
}
