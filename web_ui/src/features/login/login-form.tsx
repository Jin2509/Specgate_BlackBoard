// Form đăng nhập bằng GitHub hoặc email, giữ lại trang đích sau khi đăng nhập.
"use client";

import { Button } from "@/components/ui/button";
import { GithubMark } from "@/components/common/github-mark";
import { useQueryParam } from "@/hooks/use-query-param";
import { signIn } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const next = useQueryParam("next") ?? "";
  const error = useQueryParam("error") === "email";
  const email = useQueryParam("email");
  const fromInvite = next.startsWith("/invite/");

  return (
    <div>
      <h1 className="text-center text-2xl font-semibold text-sidebar-accent-foreground">
        {fromInvite ? "Đăng nhập để nhận lời mời" : "Chào mừng trở lại!"}
      </h1>
      <p className="mt-2 text-center text-[15px] text-muted-foreground">
        {fromInvite ? "Bạn sẽ vào thẳng workspace ngay sau khi đăng nhập." : "Rất vui được gặp lại bạn."}
      </p>

      <form action={signIn} className="mt-5 grid gap-5">
        <input type="hidden" name="next" value={next} />
        <div className="grid gap-2">
          <label
            htmlFor="email"
            className={cn("text-xs font-bold tracking-wide uppercase", error ? "text-destructive" : "text-muted-foreground")}
          >
            Email
            {error ? (
              <span className="font-medium normal-case italic"> - Không tìm thấy tài khoản</span>
            ) : (
              <span className="text-destructive"> *</span>
            )}
          </label>
          <input
            key={email ?? ""}
            id="email"
            name="email"
            type="email"
            required
            defaultValue={email ?? "trang@example.edu"}
            className="h-10 rounded-[3px] bg-input px-2.5 text-base text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-subtle">Không cần mật khẩu: liên kết đăng nhập gửi tới email, hiệu lực 15 phút.</p>
        </div>
        <Button type="submit" className="h-11 w-full text-base">
          Gửi liên kết đăng nhập
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-subtle">
        <span className="h-px flex-1 bg-border" /> hoặc <span className="h-px flex-1 bg-border" />
      </div>

      <form action={signIn}>
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="provider" value="github" />
        <Button type="submit" variant="secondary" className="h-11 w-full text-base">
          <GithubMark className="size-5" /> Tiếp tục với GitHub
        </Button>
      </form>
      <p className="mt-3 text-xs text-subtle">
        Tài khoản thử: <span className="font-mono">trang@example.edu</span>, <span className="font-mono">lan@example.edu</span>
      </p>
    </div>
  );
}
