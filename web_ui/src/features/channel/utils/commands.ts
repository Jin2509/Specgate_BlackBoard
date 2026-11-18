// Lists the slash commands a person can type in a channel, in the order of the flow's command list.
import {
  CircleHelp,
  ClipboardList,
  FileText,
  Gavel,
  Lightbulb,
  ListCollapse,
  Pin,
  StickyNote,
  type LucideIcon,
} from "lucide-react";

import { t } from "@/lib/i18n";

export interface CommandSpec {
  name: string;
  usage: string;
  description: string;
  icon: LucideIcon;
}

export const COMMANDS: readonly CommandSpec[] = [
  { name: "/idea", usage: t.commands.ideaUsage, description: t.commands.ideaDescription, icon: Lightbulb },
  { name: "/note", usage: t.commands.noteUsage, description: t.commands.noteDescription, icon: StickyNote },
  { name: "/pin", usage: "/pin", description: t.commands.pinDescription, icon: Pin },
  { name: "/decide", usage: t.commands.decideUsage, description: t.commands.decideDescription, icon: Gavel },
  { name: "/summarize", usage: "/summarize", description: t.commands.summarizeDescription, icon: ListCollapse },
  { name: "/brief", usage: "/brief", description: t.commands.briefDescription, icon: FileText },
  { name: "/task", usage: t.commands.taskUsage, description: t.commands.taskDescription, icon: ClipboardList },
  { name: "/help", usage: "/help", description: t.commands.helpDescription, icon: CircleHelp },
];
