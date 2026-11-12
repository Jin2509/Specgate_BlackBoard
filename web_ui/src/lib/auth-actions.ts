// Server action đăng nhập, đăng ký (chỉ GitHub hoặc Google) và đăng xuất.
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { registerAccount } from "@/lib/mock/mutations";
import { findOAuthAccount, getPersonalWorkspace } from "@/lib/mock/queries";
import type { AuthProvider } from "@/lib/types";
import { personalHome } from "./paths";
import { homePath } from "./home-path";
import { AUTH_COOKIE_OPTIONS, SESSION_COOKIES, safeNext } from "./session-cookies";

// Giả lập bước callback OAuth: nhà cung cấp trả về tài khoản đã chọn. Khi có Supabase Auth,
// phần này là signInWithOAuth({ provider }) và route /auth/callback đổi mã lấy phiên.
export async function signIn(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const account = findOAuthAccount(formData.get("provider"), formData.get("account"));
  if (!account) {
    const params = new URLSearchParams({ error: "oauth" });
    if (next) params.set("next", next);
    redirect(`/login?${params}`);
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIES.user, account.userId, AUTH_COOKIE_OPTIONS);
  redirect(next && next !== "/" ? next : homePath(account.userId, jar));
}

export interface SignUpState {
  error?: string;
  field?: "login" | "displayName";
  // Giữ lại chữ đã nhập để form hiện lại khi có lỗi.
  values?: { login: string; displayName: string };
  attempt?: number;
}

// Giả lập lần đầu đăng nhập bằng một tài khoản Google/GitHub chưa có trong hệ thống: nhà cung cấp trả về email hoặc
// tên GitHub và tên hiển thị, hệ thống tạo tài khoản kèm workspace riêng rồi chuyển sang bước nhập API key.
// Khi có Supabase Auth, phần này do signInWithOAuth và trigger tạo hồ sơ đảm nhận; không có form điền tay.
export async function signUp(_prev: SignUpState, formData: FormData): Promise<SignUpState> {
  const provider: AuthProvider = formData.get("provider") === "github" ? "github" : "google";
  const values = { login: String(formData.get("login") ?? ""), displayName: String(formData.get("displayName") ?? "") };
  const result = registerAccount({ provider, ...values });
  if (!result.ok) {
    const keep = { values, attempt: Date.now() };
    return result.error === "invalid-login"
      ? {
          ...keep,
          field: "login",
          error:
            provider === "github"
              ? "Tên GitHub chỉ gồm chữ, số và dấu gạch ngang, tối đa 39 ký tự."
              : "Email chưa đúng dạng, ví dụ ten@gmail.com.",
        }
      : { ...keep, field: "displayName", error: "Tên hiển thị không được trống và tối đa 40 ký tự." };
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIES.user, result.value.userId, AUTH_COOKIE_OPTIONS);
  jar.delete(SESSION_COOKIES.last);
  const home = personalHome(getPersonalWorkspace(result.value.userId)?.id);
  redirect(result.value.created ? `${home}/key?welcome=${provider}` : homePath(result.value.userId, jar));
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIES.user);
  jar.delete(SESSION_COOKIES.last);
  redirect("/login");
}
