// Cột giới thiệu ba cách vào workspace bên phải trang đăng nhập.
import { Compass, Link2, Lock } from "lucide-react";
import type { ReactNode } from "react";

const STEPS: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <Lock />,
    title: "Workspace riêng có sẵn",
    body: "Đăng nhập xong là có một chỗ chỉ mình bạn thấy, đủ kênh, agent và bảng ý tưởng.",
  },
  {
    icon: <Link2 />,
    title: "Có liên kết mời",
    body: "Mở liên kết từ bạn bè là vào thẳng workspace chung, không phải chờ.",
  },
  {
    icon: <Compass />,
    title: "Không có lời mời",
    body: "Tìm ở trang Khám phá, gửi yêu cầu kèm những ý đã có. Chủ workspace duyệt.",
  },
];

export function JoinGuide() {
  return (
    <div>
      <p className="text-xs font-bold tracking-wide text-subtle uppercase">Vào workspace bằng cách nào</p>
      <ol className="mt-4 space-y-4">
        {STEPS.map((s) => (
          <li key={s.title} className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-4">
              {s.icon}
            </span>
            <span>
              <span className="block text-sm font-semibold text-sidebar-accent-foreground">{s.title}</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-subtle">{s.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
