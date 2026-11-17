// Snaps a text selection to whole words, code lines, table cells or marked lines so a quote never splits a token.

/** One "word": letters, digits and the marks found inside numbers or identifiers (0.842, HumanEval/38, a_b-c). */
const WORD = /[\p{L}\p{N}\p{M}_./%-]/u;

const toElement = (node: Node) => (node instanceof Element ? node : node.parentElement);

function textNodes(root: Node): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n as Text);
  return out;
}

function toIndex(root: Node, node: Node, offset: number): number {
  // Range.toString() joins text node data exactly, so its length is the offset inside root.textContent.
  const before = document.createRange();
  before.selectNodeContents(root);
  before.setEnd(node, offset);
  return before.toString().length;
}

function fromIndex(root: Node, index: number): [Node, number] {
  let i = 0;
  const nodes = textNodes(root);
  for (const t of nodes) {
    if (index <= i + t.data.length) return [t, index - i];
    i += t.data.length;
  }
  const last = nodes.at(-1);
  return last ? [last, last.data.length] : [root, 0];
}

function widen(root: Node, start: number, end: number, inside: (ch: string) => boolean): [number, number] {
  const text = root.textContent ?? "";
  while (start > 0 && inside(text[start - 1]) && inside(text[start])) start--;
  while (end < text.length && inside(text[end]) && inside(text[end - 1])) end++;
  return [start, end];
}

function snapEnd(range: Range, which: "start" | "end") {
  const node = which === "start" ? range.startContainer : range.endContainer;
  const offset = which === "start" ? range.startOffset : range.endOffset;
  const host = toElement(node);
  if (!host) return;
  const line = host.closest<HTMLElement>("[data-snap='line']");
  const cell = host.closest<HTMLElement>("td,th");
  const code = host.closest<HTMLElement>("pre");
  if (line || cell) {
    const target = (line ?? cell)!;
    if (which === "start") range.setStart(target, 0);
    else range.setEnd(target, target.childNodes.length);
    return;
  }
  const root = code ?? host.closest<HTMLElement>("p,li,blockquote,h1,h2,h3,h4,h5,h6,div") ?? host;
  const i = toIndex(root, node, offset);
  const [a, b] = code
    ? widen(root, i, i, (ch) => ch !== undefined && ch !== "\n")
    : widen(root, i, i, (ch) => ch !== undefined && WORD.test(ch));
  const [n, o] = fromIndex(root, which === "start" ? a : b);
  if (which === "start") range.setStart(n, o);
  else range.setEnd(n, o);
}

/** Snap the current selection to its content unit, update the on-screen selection and return the snapped range. */
export function snapSelection(sel: Selection | null): Range | null {
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const range = sel.getRangeAt(0).cloneRange();
  try {
    snapEnd(range, "start");
    snapEnd(range, "end");
  } catch {
    // A range over nodes that changed mid-selection cannot be snapped; keep the raw selection.
    return sel.getRangeAt(0);
  }
  if (range.collapsed) return sel.getRangeAt(0);
  sel.removeAllRanges();
  sel.addRange(range);
  return range;
}
