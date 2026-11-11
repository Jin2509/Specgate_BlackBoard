// Tính trang đích sau đăng nhập: màn chào lần đầu, workspace mở gần nhất hoặc workspace riêng.
import { getPersonalWorkspace, getWorkspace, isMember } from "@/lib/mock/queries";
import { SESSION_COOKIES, joinedOf, splitList } from "./session-cookies";

type CookieReader = { get(name: string): { value: string } | undefined };

export function homePath(userId: string, cookies: CookieReader): string {
  const onboarded = splitList(cookies.get(SESSION_COOKIES.onboarded)?.value).includes(userId);
  if (!onboarded) return "/welcome";
  const joined = joinedOf(cookies.get(SESSION_COOKIES.joined)?.value, userId);
  const last = getWorkspace(cookies.get(SESSION_COOKIES.last)?.value);
  const target = last && isMember(last, userId, joined) ? last : getPersonalWorkspace(userId);
  return `/w/${target?.id}/c/chung`;
}
