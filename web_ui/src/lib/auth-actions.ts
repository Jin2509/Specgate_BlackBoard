// Server action đăng nhập, đăng xuất, hoàn tất màn chào và nhận lời mời.
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findUserByEmail, getInvite, getPersonalWorkspace, getProfile } from "@/lib/mock/queries";
import { homePath } from "./home-path";
import { COOKIE_OPTIONS, SESSION_COOKIES, addToList, inviteCodeFrom, safeNext } from "./session-cookies";

export async function signIn(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const provider = formData.get("provider");
  const email = String(formData.get("email") ?? "");
  const user = provider === "github" ? getProfile("trang") : findUserByEmail(email);
  if (!user) {
    const params = new URLSearchParams({ error: "email", email });
    if (next) params.set("next", next);
    redirect(`/login?${params}`);
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIES.user, user.id, COOKIE_OPTIONS);
  redirect(next && next !== "/" ? next : homePath(user.id, jar));
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIES.user);
  jar.delete(SESSION_COOKIES.last);
  redirect("/login");
}

async function markOnboarded(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIES.onboarded, addToList(jar.get(SESSION_COOKIES.onboarded)?.value, userId), COOKIE_OPTIONS);
}

export async function finishWelcome(formData: FormData) {
  const jar = await cookies();
  const userId = jar.get(SESSION_COOKIES.user)?.value;
  if (!userId) redirect("/login");
  await markOnboarded(userId);
  const personal = getPersonalWorkspace(userId);
  redirect(safeNext(formData.get("to")) ?? `/w/${personal?.id}/c/chung`);
}

export async function openInvite(formData: FormData) {
  const code = inviteCodeFrom(String(formData.get("invite") ?? ""));
  redirect(code ? `/invite/${code}` : "/welcome?error=invite");
}

export async function acceptInvite(formData: FormData) {
  const jar = await cookies();
  const userId = jar.get(SESSION_COOKIES.user)?.value;
  const invite = getInvite(String(formData.get("code") ?? ""));
  if (!userId) redirect("/login");
  if (!invite) redirect("/welcome?error=invite");
  jar.set(
    SESSION_COOKIES.joined,
    addToList(jar.get(SESSION_COOKIES.joined)?.value, `${userId}:${invite.workspaceId}`),
    COOKIE_OPTIONS,
  );
  await markOnboarded(userId);
  redirect(`/w/${invite.workspaceId}/c/chung`);
}
