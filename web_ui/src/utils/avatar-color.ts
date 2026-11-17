// Resolves a member's avatar colour index to its CSS token (12 colours, unique per workspace while they last).
const AVATAR_COLOR_COUNT = 12;

export function toAvatarColor(colorIndex: number | undefined): string | undefined {
  return colorIndex === undefined ? undefined : `var(--avatar-${colorIndex % AVATAR_COLOR_COUNT})`;
}
