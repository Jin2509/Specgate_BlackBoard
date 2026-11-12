// Form đăng ký giả lập phần thông tin Google/GitHub trả về sau khi người dùng đồng ý.
// Khi nối Supabase Auth, nhà cung cấp tự gửi email (hoặc tên GitHub) và tên hiển thị; form này sẽ bỏ đi.
"use client";

import { LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, type SignUpState } from "@/lib/auth-actions";
import type { AuthProvider } from "@/lib/types";
import { providerMeta } from "./providers";

export function SignUpForm({ provider }: { provider: AuthProvider }) {
  const [state, action, pending] = useActionState<SignUpState, FormData>(signUp, {});
  const github = provider === "github";
  const label = providerMeta[provider].label;

  return (
    <form action={action} className="mt-6 grid gap-4" noValidate>
      <input type="hidden" name="provider" value={provider} />
      <div className="grid gap-1.5">
        <Label htmlFor="su-login" className="text-[13px] font-semibold text-muted-foreground">
          {github ? "Tên người dùng GitHub" : "Email Google"}
        </Label>
        <Input
          key={`login-${state.attempt ?? 0}`}
          defaultValue={state.values?.login}
          id="su-login"
          name="login"
          type={github ? "text" : "email"}
          autoComplete={github ? "username" : "email"}
          placeholder={github ? "vd. lan-pham" : "vd. ten@gmail.com"}
          spellCheck={false}
          required
          aria-invalid={state.field === "login" ? true : undefined}
          aria-describedby={state.field === "login" ? "su-error" : undefined}
          className="h-10 bg-card"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="su-name" className="text-[13px] font-semibold text-muted-foreground">
          Tên hiển thị
        </Label>
        <Input
          key={`name-${state.attempt ?? 0}`}
          defaultValue={state.values?.displayName}
          id="su-name"
          name="displayName"
          autoComplete="name"
          placeholder="Tên mọi người thấy trong kênh"
          maxLength={40}
          required
          aria-invalid={state.field === "displayName" ? true : undefined}
          aria-describedby={state.field === "displayName" ? "su-error" : undefined}
          className="h-10 bg-card"
        />
      </div>
      {state.error ? (
        <p id="su-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="h-10">
        {pending ? <LoaderCircle className="animate-spin" /> : providerMeta[provider].icon("size-4")}
        {pending ? "Đang tạo tài khoản" : `Đồng ý và tạo tài khoản bằng ${label}`}
      </Button>
      <p className="text-xs leading-relaxed text-subtle">
        Nếu tài khoản {label} này đã đăng ký rồi, bạn được đăng nhập luôn, không tạo tài khoản mới.
      </p>
    </form>
  );
}
