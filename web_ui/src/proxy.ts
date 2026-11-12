// Chặn route khi chưa đăng nhập và ghi nhớ workspace vừa mở. Trang gốc "/" do app/page.tsx điều hướng.
import { NextResponse, type NextRequest } from "next/server";
import { getProfile, getWorkspace } from "@/lib/mock/queries";
import { COOKIE_OPTIONS, SESSION_COOKIES } from "@/lib/session-cookies";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const user = getProfile(request.cookies.get(SESSION_COOKIES.user)?.value);
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if (pathname === "/login") return user ? go("/") : NextResponse.next();
  if (!user) return go(`/login?next=${encodeURIComponent(pathname + search)}`);

  const ws = /^\/w\/([^/]+)/.exec(pathname)?.[1];
  const response = NextResponse.next();
  if (ws && getWorkspace(ws)) response.cookies.set(SESSION_COOKIES.last, ws, COOKIE_OPTIONS);
  return response;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/join/:path*",
    {
      source: "/w/:path*",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
