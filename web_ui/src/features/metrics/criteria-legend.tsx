// Chú giải dưới lưới sáu tiêu chí.
export function CriteriaLegend() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-3 w-0.75 rounded-full bg-foreground/60" /> điểm ước lượng và khoảng tin cậy
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-3 border-l border-dashed border-foreground/60" /> ngưỡng đã đăng ký trước
      </span>
      <span>
        <span className="font-medium text-insufficient">Thiếu dữ liệu</span> không phải là đạt, kể cả khi điểm ước lượng vượt
        ngưỡng (xem tiêu chí 5)
      </span>
    </p>
  );
}
