// Quản lý danh sách agent và agent đang sửa.
"use client";

import { useState } from "react";
import type { Agent } from "@/lib/types";
import { AgentEditor } from "./agent-editor";
import { AgentTable } from "./agent-table";

export function AgentSettings({ initialAgents, editId }: { initialAgents: Agent[]; editId?: string }) {
  const [agents, setAgents] = useState(initialAgents);
  const [editing, setEditing] = useState<string | undefined>(editId);
  const current = agents.find((a) => a.id === editing);

  return (
    <div className="space-y-4">
      <AgentTable
        agents={agents}
        editingId={editing}
        onEdit={setEditing}
        onToggle={(id, enabled) => setAgents((prev) => prev.map((x) => (x.id === id ? { ...x, enabled } : x)))}
      />
      {current ? <AgentEditor key={current.id} agent={current} onCancel={() => setEditing(undefined)} /> : null}
    </div>
  );
}
