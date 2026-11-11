// Chặn route khi chưa đăng nhập, điều hướng trang gốc và ghi nhớ workspace vừa mở.
import { NextResponse, type NextRequest } from "next/server";
import { homePath } from "@/lib/home-path";
import { getProfile, getWorkspace } from "@/lib/mock/queries";
import { COOKIE_OPTIONS, SESSION_COOKIES } from "@/lib/session-cookies";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const user = getProfile(request.cookies.get(SESSION_COOKIES.user)?.value);
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if (pathname === "/login") return user ? go("/") : NextResponse.next();
  if (!user) return go(`/login?next=${encodeURIComponent(pathname + search)}`);

  if (pathname === "/") return go(homePath(user.id, request.cookies));

  const ws = /^\/w\/([^/]+)/.exec(pathname)?.[1];
  const response = NextResponse.next();
  if (ws && getWorkspace(ws)) response.cookies.set(SESSION_COOKIES.last, ws, COOKIE_OPTIONS);
  return response;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/welcome",
    "/invite/:path*",
    {
      source: "/w/:path*",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
