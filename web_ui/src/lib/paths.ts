// Đường dẫn trang đầu của từng loại workspace: workspace riêng mở trang chat với agent, workspace chung mở kênh chung.
export const personalHome = (workspaceId: string | undefined) => `/w/${workspaceId}/chat`;
export const sharedHome = (workspaceId: string) => `/w/${workspaceId}/c/chung`;
export const workspaceHome = (ws: { id: string; kind: "personal" | "shared" }) =>
  ws.kind === "personal" ? personalHome(ws.id) : sharedHome(ws.id);
