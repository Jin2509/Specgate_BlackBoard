// Describes the join code format shared by the code form and the code display.
export const JOIN_CODE_LENGTH = 7;

/** Slack for spaces or hyphens people type inside a code, such as "adm-7q3p". */
export const JOIN_CODE_INPUT_SLACK = 4;

export function toCodeCharacters(code: string): string[] {
  return code.split("");
}
