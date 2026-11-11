// Thông báo khi liên kết hoặc mã mời vừa nhập không hợp lệ.
"use client";

import { useQueryParam } from "@/hooks/use-query-param";

export function InviteError() {
  if (useQueryParam("error") !== "invite") return null;
  return <p className="text-xs text-destructive">Liên kết mời không hợp lệ hoặc đã hết hạn.</p>;
}
