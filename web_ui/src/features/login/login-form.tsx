// Đăng nhập hoặc tạo tài khoản, chỉ bằng Google hoặc GitHub. Hai chế độ đổi qua tham số ?mode=signup.
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useQueryParam } from "@/hooks/use-query-param";
import { cn } from "@/lib/utils";
import { AUTH_PROVIDERS, providerMeta } from "./providers";

export function LoginForm() {
  const next = useQueryParam("next") ?? "";
  const error = useQueryParam("error") === "oauth";
  const signup = useQueryParam("mode") === "signup";
  const keep = (extra: Record<string, string>) => {
    const params = new URLSearchParams(extra);
    if (next) params.set("next", next);
    const q = params.toString();
    return q ? `?${q}` : "";
  };

  return (
    <div>
      <div role="tablist" aria-label="Đăng nhập hoặc tạo tài khoản" className="inline-flex gap-0.5 rounded-lg bg-muted p-0.5">
        <ModeTab href={`/login${keep({})}`} active={!signup}>
          Đăng nhập
        </ModeTab>
        <ModeTab href={`/login${keep({ mode: "signup" })}`} active={signup}>
          Tạo tài khoản
        </ModeTab>
      </div>

      <h1 className="mt-5 text-2xl font-semibold text-sidebar-accent-foreground">{signup ? "Tạo tài khoản" : "Đăng nhập"}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
        {signup
          ? "Đăng ký bằng tài khoản Google hoặc GitHub bạn đang có. SpecGate không có mật khẩu riêng."
          : "Dùng tài khoản Google hoặc GitHub bạn đã đăng ký với SpecGate."}
      </p>

      <div className="mt-6 grid gap-3">
        {AUTH_PROVIDERS.map((p) => (
          <Button key={p} asChild variant="outline" className="h-11 w-full justify-start gap-3 bg-card px-4 text-base">
            <Link href={`/login/${p}${keep(signup ? { intent: "signup" } : {})}`} prefetch={false}>
              {providerMeta[p].icon("size-5")} {signup ? "Đăng ký với" : "Tiếp tục với"} {providerMeta[p].label}
            </Link>
          </Button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          Đăng nhập không thành công. Hãy thử lại hoặc chọn tài khoản khác.
        </p>
      ) : null}

      {signup ? (
        <ol className="mt-5 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed text-muted-foreground marker:text-subtle">
          <li>Chọn Google hoặc GitHub và đồng ý cho SpecGate đọc tên và email.</li>
          <li>Hệ thống tạo tài khoản và một workspace riêng cho bạn.</li>
          <li>Nhập API key của agent để bắt đầu chat.</li>
        </ol>
      ) : null}

      <p className="mt-5 text-sm text-muted-foreground">
        {signup ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
        <Link
          href={`/login${keep(signup ? {} : { mode: "signup" })}`}
          className="font-medium text-primary-strong underline-offset-2 hover:underline"
        >
          {signup ? "Đăng nhập" : "Tạo tài khoản"}
        </Link>
      </p>
    </div>
  );
}

function ModeTab({ href, active, children }: { href: string; active: boolean; children: string }) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        active ? "bg-card font-medium text-foreground shadow-sm" : "text-subtle hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
