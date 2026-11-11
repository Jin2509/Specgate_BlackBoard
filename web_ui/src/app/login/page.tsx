// Trang đăng nhập: điểm vào đầu tiên của ứng dụng.
import type { Metadata } from "next";
import { AuthScreen } from "@/features/login/auth-screen";
import { JoinGuide } from "@/features/login/join-guide";
import { LoginForm } from "@/features/login/login-form";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <AuthScreen className="max-w-196">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_260px] md:gap-10">
        <LoginForm />
        <div className="border-t border-border pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-10">
          <JoinGuide />
        </div>
      </div>
    </AuthScreen>
  );
}
