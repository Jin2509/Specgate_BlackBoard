// Ba lựa chọn ở màn chào: workspace riêng, tạo workspace chung, khám phá.
import { ChevronRight, Compass, Lock, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { finishWelcome } from "@/lib/auth-actions";

export function WelcomeOptions({ personalId }: { personalId: string }) {
  const base = `/w/${personalId}`;
  return (
    <div className="grid gap-2">
      <Option to={`${base}/c/chung`} icon={<Lock />} title="Bắt đầu ở workspace riêng">
        Nghĩ một mình trước với các agent, đưa ra nhóm sau.
      </Option>
      <Option to={`${base}/c/chung?dialog=create`} icon={<Plus />} title="Tạo workspace chung">
        Đặt đề bài, mời bạn bè bằng liên kết.
      </Option>
      <Option to={`${base}/explore`} icon={<Compass />} title="Khám phá workspace chung">
        Tìm nhóm đang làm cùng đề tài và xin tham gia.
      </Option>
    </div>
  );
}

function Option({ to, icon, title, children }: { to: string; icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <form action={finishWelcome}>
      <input type="hidden" name="to" value={to} />
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-lg border border-border bg-canvas p-3 text-left transition-colors hover:bg-hover"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground [&_svg]:size-5">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-sidebar-accent-foreground">{title}</span>
          <span className="block text-[13px] text-subtle">{children}</span>
        </span>
        <ChevronRight className="size-5 text-subtle" />
      </button>
    </form>
  );
}
