// Ô sửa đề bài của workspace.
import { Target } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Panel } from "@/components/common/panel";

export function BriefEditor({ brief }: { brief: string }) {
  return (
    <Panel title="Đề bài" icon={<Target />}>
      <Textarea defaultValue={brief} rows={4} className="text-[13px]" aria-label="Đề bài" />
      <p className="mt-2 text-[11px] text-muted-foreground">Sửa đề bài sẽ đổi ngữ cảnh của mọi agent từ lần gọi kế tiếp.</p>
    </Panel>
  );
}
