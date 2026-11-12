// Tên cookie phiên đăng nhập giả lập và các hàm đọc/ghi giá trị của chúng.
export const SESSION_COOKIES = {
  user: "sg_uid",
  last: "sg_last",
} as const;

export const COOKIE_OPTIONS = { path: "/", httpOnly: true, sameSite: "lax" as const, maxAge: 60 * 60 * 24 * 30 };

// Cookie đăng nhập không có maxAge: hết khi đóng trình duyệt, mở lại web phải đăng nhập lại.
export const AUTH_COOKIE_OPTIONS = { path: "/", httpOnly: true, sameSite: "lax" as const };

export function safeNext(next: unknown): string | undefined {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
}
