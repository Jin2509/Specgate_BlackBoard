// Danh sách lệnh / của lõi và của mô-đun ADOM.
import type { LucideIcon } from "lucide-react";
import { CircleHelp, ListCollapse, FileText, FlaskConical, Gavel, Lightbulb, Pin, Play, StickyNote, Table2 } from "lucide-react";

export interface CommandSpec {
  name: string;
  usage: string;
  description: string;
  icon: LucideIcon;
  module?: "adom";
}

export const COMMANDS: CommandSpec[] = [
  { name: "/idea", usage: "/idea <nội dung>", description: "Ghi một ý lên bảng", icon: Lightbulb },
  { name: "/pin", usage: "/pin", description: "Đưa tin nhắn đang trả lời lên bảng", icon: Pin },
  { name: "/note", usage: "/note <nội dung>", description: "Thêm ghi chú", icon: StickyNote },
  { name: "/decide", usage: "/decide #<ý> chốt|loại <lý do>", description: "Chốt hoặc loại một ý, kèm lý do", icon: Gavel },
  { name: "/summarize", usage: "/summarize", description: "Tóm tắt kênh (chủ workspace)", icon: ListCollapse },
  { name: "/brief", usage: "/brief", description: "Xuất bản tổng hợp (chủ workspace)", icon: FileText },
  { name: "/help", usage: "/help", description: "Danh sách lệnh", icon: CircleHelp },
  {
    name: "/stats",
    usage: "/stats <lượt>",
    description: "Thẻ sáu tiêu chí của một lượt chạy",
    icon: FlaskConical,
    module: "adom",
  },
  { name: "/task", usage: "/task <HumanEval/n>", description: "Số liệu một tác vụ", icon: Table2, module: "adom" },
  { name: "/run", usage: "/run <tác vụ…>", description: "Chạy thử pipeline quy mô nhỏ (fixture)", icon: Play, module: "adom" },
];

export function commandsFor(modules: string[]): CommandSpec[] {
  return COMMANDS.filter((c) => !c.module || modules.includes(c.module));
}
