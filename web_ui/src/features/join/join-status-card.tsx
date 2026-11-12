// Thẻ trạng thái yêu cầu tham gia: đang chờ (tự làm mới), bị từ chối hoặc đã hủy.
import Link from "next/link";
import { Clock, KeyRound, Users, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { AutoRefresh } from "@/components/common/auto-refresh";
import { Button } from "@/components/ui/button";
import { cancelRequest } from "@/lib/join-actions";
import type { JoinRequest, Profile, Workspace } from "@/lib/types";
import { personalHome } from "@/lib/paths";

export function JoinStatusCard({
  request,
  ws,
  owner,
  personalId,
}: {
  request: JoinRequest;
  ws: Workspace;
  owner: Profile | undefined;
  personalId: string | undefined;
}) {
  const personalHref = personalHome(personalId);
  const pending = request.status === "pending";

  return (
    <div className="flex flex-col items-center text-center">
      {pending ? <AutoRefresh /> : null}
      <span className="relative flex size-20 items-center justify-center rounded-3xl bg-primary text-2xl font-bold text-primary-foreground">
        {ws.short}
        <span className="absolute -right-1.5 -bottom-1.5 flex size-8 items-center justify-center rounded-full border-4 border-canvas bg-card">
          {pending ? <Clock className="size-4 text-proposed" /> : <XCircle className="size-4 text-rejected" />}
        </span>
      </span>

      <h1 className="mt-5 text-2xl font-semibold text-sidebar-accent-foreground">
        {pending ? "Đang chờ duyệt" : request.status === "rejected" ? "Yêu cầu bị từ chối" : "Đã hủy yêu cầu"}
      </h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        {pending ? (
          <>
            Đã gửi yêu cầu vào <span className="font-semibold text-foreground">{ws.name}</span>.{" "}
            {owner?.displayName ?? "Chủ workspace"} duyệt xong, trang này tự mở workspace cho bạn.
          </>
        ) : request.status === "rejected" ? (
          <>
            {owner?.displayName ?? "Chủ workspace"} chưa nhận bạn vào {ws.name}. Bạn có thể xin mã mới và gửi lại.
          </>
        ) : (
          <>Yêu cầu vào {ws.name} đã được hủy.</>
        )}
      </p>

      <dl className="mt-5 grid w-full gap-2 rounded-md bg-card p-3 text-left text-sm">
        <Row label="Đề bài">{ws.brief}</Row>
        <Row label="Cách gửi">
          {request.via === "code" ? (
            <span className="inline-flex items-center gap-1.5">
              <KeyRound className="size-3.5" /> Mã <span className="font-mono">{request.code}</span>
            </span>
          ) : (
            "Từ trang Khám phá"
          )}
        </Row>
        <Row label="Lúc">{request.at}</Row>
        <Row label="Nhóm">
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" /> {ws.members.length} thành viên
            </span>
          </span>
        </Row>
      </dl>

      {pending ? (
        <p className="mt-4 inline-flex items-center gap-2 text-xs text-subtle">
          <span className="size-2 animate-pulse rounded-full bg-proposed" /> Đang chờ xác nhận, tự kiểm tra mỗi 3 giây
        </p>
      ) : null}

      <div className="mt-5 grid w-full gap-2 sm:grid-cols-2">
        <Button asChild className="h-11 text-base">
          <Link href={personalHref}>Về workspace riêng</Link>
        </Button>
        {pending ? (
          <form action={cancelRequest}>
            <input type="hidden" name="requestId" value={request.id} />
            <Button type="submit" variant="secondary" className="h-11 w-full text-base">
              Hủy yêu cầu
            </Button>
          </form>
        ) : (
          <Button asChild variant="secondary" className="h-11 text-base">
            <Link href={`/w/${personalId}/explore`}>Tìm workspace khác</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-2">
      <dt className="text-[13px] font-semibold text-subtle">{label}</dt>
      <dd className="leading-snug text-foreground">{children}</dd>
    </div>
  );
}
