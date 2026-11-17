// Lowercases the first letter so a stored reason reads naturally after "Because".
export function toLowerFirst(text: string | null | undefined): string {
  return text ? text[0].toLowerCase() + text.slice(1) : "";
}
