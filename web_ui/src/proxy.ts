// Guards routes behind sign-in, slides the session and reports the last opened workspace to the backend.
import { NextResponse, type NextRequest } from "next/server";

import {
  LAST_WORKSPACE_COOKIE,
  LAST_WORKSPACE_COOKIE_OPTIONS,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
} from "@/config/session-cookie";
import { getBackendSession, type BackendSession } from "@/features/auth";
import { request as requestBackend } from "@/lib/api/http-client";

const WORKSPACE_PATH = /^\/w\/([^/]+)/;

function isLoginPath(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/login/");
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let session: BackendSession | null;
  try {
    session = await getBackendSession(token);
  } catch {
    // An unreachable backend must not sign the user out; the page reports the outage itself.
    return NextResponse.next();
  }
  const redirectTo = (path: string) => {
    const response = NextResponse.redirect(new URL(path, request.url));
    if (token && !session) response.cookies.delete(SESSION_COOKIE);
    return response;
  };

  if (isLoginPath(pathname)) {
    if (session) return redirectTo(session.home);
    const response = NextResponse.next();
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }
  if (!session) return redirectTo(`/login?next=${encodeURIComponent(pathname + search)}`);

  const response = NextResponse.next();
  // Every visit restarts the 30-day session.
  if (session.token) response.cookies.set(SESSION_COOKIE, session.token, SESSION_COOKIE_OPTIONS);
  const workspaceId = WORKSPACE_PATH.exec(pathname)?.[1];
  if (workspaceId && request.cookies.get(LAST_WORKSPACE_COOKIE)?.value !== workspaceId) {
    // The backend ignores the personal workspace and workspaces the user is not a member of.
    await requestBackend("/me/last-workspace", { method: "PUT", body: { workspaceId }, token }).catch(() => undefined);
    response.cookies.set(LAST_WORKSPACE_COOKIE, workspaceId, LAST_WORKSPACE_COOKIE_OPTIONS);
  }
  return response;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/login/:path*",
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
