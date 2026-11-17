// Lists the slash commands of a channel; /stats and /task exist only where the paper metrics module is attached.
import {
  CircleHelp,
  FileText,
  FlaskConical,
  Gavel,
  Lightbulb,
  ListCollapse,
  Pin,
  StickyNote,
  Table2,
  type LucideIcon,
} from "lucide-react";

import { t } from "@/lib/i18n";
import type { WorkspaceModule } from "@/types/workspace";

export interface CommandSpec {
  name: string;
  usage: string;
  description: string;
  icon: LucideIcon;
  module?: WorkspaceModule;
}

export const COMMANDS: readonly CommandSpec[] = [
  { name: "/idea", usage: t.commands.ideaUsage, description: t.commands.ideaDescription, icon: Lightbulb },
  { name: "/pin", usage: "/pin", description: t.commands.pinDescription, icon: Pin },
  { name: "/note", usage: t.commands.noteUsage, description: t.commands.noteDescription, icon: StickyNote },
  { name: "/decide", usage: t.commands.decideUsage, description: t.commands.decideDescription, icon: Gavel },
  { name: "/summarize", usage: "/summarize", description: t.commands.summarizeDescription, icon: ListCollapse },
  { name: "/brief", usage: "/brief", description: t.commands.briefDescription, icon: FileText },
  { name: "/help", usage: "/help", description: t.commands.helpDescription, icon: CircleHelp },
  { name: "/stats", usage: "/stats", description: t.commands.statsDescription, icon: FlaskConical, module: "adom" },
  { name: "/task", usage: "/task <HumanEval/n>", description: t.commands.taskDescription, icon: Table2, module: "adom" },
];

export function listCommands(modules: readonly string[]): CommandSpec[] {
  return COMMANDS.filter((command) => !command.module || modules.includes(command.module));
}
