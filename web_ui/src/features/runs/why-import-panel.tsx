// Khối giải thích vì sao nhập tệp thay vì chạy lại.
import { Info } from "lucide-react";
import { Panel } from "@/components/common/panel";

export function WhyImportPanel() {
  return (
    <Panel title="Vì sao nhập tệp thay vì chạy lại" icon={<Info />}>
      <div className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">
        <p>
          Một lượt 162 tác vụ mất hàng chục phút và thực thi mã do LLM sinh. Trang này chỉ đọc kết quả đã chấm, không tính lại,
          nên số trên web không thể lệch với báo cáo.
        </p>
        <p>
          Trạng thái <span className="font-medium text-rejected">invalidated</span> đi theo mọi con số của lượt chạy: trên bảng số
          liệu, trong thẻ ở kênh chat, và trong ngữ cảnh gửi cho agent.
        </p>
        <p>
          Muốn thử pipeline ở quy mô nhỏ, dùng lệnh{" "}
          <code className="rounded bg-data-soft px-1 font-mono text-xs text-data">/run</code> trong kênh.
        </p>
      </div>
    </Panel>
  );
}
