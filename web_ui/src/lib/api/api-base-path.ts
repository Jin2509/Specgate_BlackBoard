// Defines the versioned path prefix of every backend endpoint, used by server calls and browser streams alike.
export const API_BASE_PATH = "/api/v1";

export function toApiPath(resourcePath: string): string {
  return `${API_BASE_PATH}${resourcePath}`;
}
