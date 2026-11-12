// Vùng cuộn tự xuống cuối khi có nội dung mới (tin nhắn, lượt chat).
"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function ScrollToEnd({ watch, className, children }: { watch: unknown; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [watch]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
