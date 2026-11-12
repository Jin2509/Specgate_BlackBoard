// Cột giới thiệu cách vào workspace bên phải trang đăng nhập.
import { Compass, KeyRound, Lock, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

const STEPS: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <Lock />,
    title: "Bắt đầu ở workspace riêng",
    body: "Nhập API key và chat với agent, chỉ mình bạn thấy. Đoạn nào đáng bàn thì highlight.",
  },
  {
    icon: <KeyRound />,
    title: "Nhận mã tham gia",
    body: "Thành viên của workspace chung bấm Chia sẻ mã và gửi cho bạn mã 7 ký tự.",
  },
  {
    icon: <ShieldCheck />,
    title: "Nhập mã, chờ duyệt",
    body: "Chủ workspace xác nhận là bạn vào nhóm, workspace hiện trên thanh bên trái.",
  },
  {
    icon: <Compass />,
    title: "Chưa có mã?",
    body: "Tìm ở trang Khám phá và gửi yêu cầu kèm lời nhắn cho chủ workspace.",
  },
];

export function JoinGuide() {
  return (
    <div>
      <p className="text-[13px] font-semibold text-subtle">Vào workspace chung</p>
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
