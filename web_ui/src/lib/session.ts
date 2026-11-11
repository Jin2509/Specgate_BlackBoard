// Đọc phiên đăng nhập hiện tại từ cookie ở phía máy chủ.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getProfile } from "@/lib/mock/queries";
import type { Profile } from "@/lib/types";
import { SESSION_COOKIES, joinedOf, splitList } from "./session-cookies";

export interface Session {
  user: Profile;
  joined: string[];
  onboarded: boolean;
}

export const getSession = cache(async (): Promise<Session | null> => {
  const jar = await cookies();
  const user = getProfile(jar.get(SESSION_COOKIES.user)?.value);
  if (!user) return null;
  return {
    user,
    joined: joinedOf(jar.get(SESSION_COOKIES.joined)?.value, user.id),
    onboarded: splitList(jar.get(SESSION_COOKIES.onboarded)?.value).includes(user.id),
  };
});

export async function requireSession(next?: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return session;
}
