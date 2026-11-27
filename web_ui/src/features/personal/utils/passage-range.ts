// Finds the DOM range of a saved passage, ignoring the whitespace and Markdown markup that a selection drops or adds.
const IGNORED_IN_MATCH = /[\s*_`~|]+/g;

/** Text with whitespace and Markdown markers removed, so a passage matches the way the backend compares it. */
export function toMatchKey(text: string): string {
  return text.replace(IGNORED_IN_MATCH, "");
}

export interface TextIndex {
  matchKey: string;
  positions: Array<{ node: Text; offset: number }>;
}

/** Walk the root's text once; several passages of the same answer are then found without walking it again. */
export function createTextIndex(root: HTMLElement): TextIndex {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const positions: TextIndex["positions"] = [];
  let matchKey = "";
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    if (node.parentElement?.closest("[data-no-mark]")) continue;
    for (let index = 0; index < node.data.length; index++) {
      const character = node.data[index];
      if (!toMatchKey(character)) continue;
      matchKey += character;
      positions.push({ node, offset: index });
    }
  }
  return { matchKey, positions };
}

/** The range of the first match of the passage in an indexed text, or null when the text is not there. */
export function toRangeInIndex(textIndex: TextIndex, passage: string): Range | null {
  const target = toMatchKey(passage);
  if (!target) return null;
  const start = textIndex.matchKey.indexOf(target);
  if (start < 0) return null;
  const first = textIndex.positions[start];
  const last = textIndex.positions[start + target.length - 1];
  const range = document.createRange();
  range.setStart(first.node, first.offset);
  range.setEnd(last.node, last.offset + 1);
  return range;
}

/** The range of the first match of the passage inside the root's text, or null when the text is not there. */
export function toPassageRange(root: HTMLElement, passage: string): Range | null {
  return toRangeInIndex(createTextIndex(root), passage);
}
