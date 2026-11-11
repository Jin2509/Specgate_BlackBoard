// Trang 404 khi workspace, kênh, lời mời hoặc trang không tồn tại.
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthScreen } from "@/features/login/auth-screen";

export default function NotFound() {
  return (
    <AuthScreen className="max-w-120 text-center">
      <p className="font-mono text-sm text-subtle">404</p>
      <h1 className="mt-1 text-2xl font-semibold text-sidebar-accent-foreground">Không tìm thấy trang này</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        Workspace hoặc kênh có thể đã bị đổi tên, hoặc workspace chưa gắn mô-đun dữ kiện.
      </p>
      <Button asChild className="mt-6 h-11 w-full text-base">
        <Link href="/" prefetch={false}>
          Về trang của bạn
        </Link>
      </Button>
    </AuthScreen>
  );
}
