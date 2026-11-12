// Tính trang đích sau đăng nhập: workspace mở gần nhất nếu còn là thành viên, không thì workspace riêng.
import { getPersonalWorkspace, getWorkspace, isMember } from "@/lib/mock/queries";
import { workspaceHome } from "./paths";
import { SESSION_COOKIES } from "./session-cookies";

type CookieReader = { get(name: string): { value: string } | undefined };

export function homePath(userId: string, cookies: CookieReader): string {
  const last = getWorkspace(cookies.get(SESSION_COOKIES.last)?.value);
  const target = last && isMember(last, userId) ? last : getPersonalWorkspace(userId);
  return target ? workspaceHome(target) : "/login";
}
