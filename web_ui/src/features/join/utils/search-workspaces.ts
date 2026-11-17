// Filters workspaces by a case-insensitive match on their name or brief.
export function searchWorkspaces<T extends { name: string; brief: string }>(workspaces: T[], query: string): T[] {
  const needle = query.trim().toLowerCase();
  return workspaces.filter(
    (workspace) => !needle || workspace.name.toLowerCase().includes(needle) || workspace.brief.toLowerCase().includes(needle),
  );
}
