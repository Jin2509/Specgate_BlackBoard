// Fails when a source file lacks its one-line header, contains Vietnamese text, or hard-codes a hex colour.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SCANNED_DIRECTORIES = ["src", "scripts", "tests"];
const ROOT_FILES = ["eslint.config.mjs", "next.config.ts", "vitest.config.mts", "playwright.config.ts", "postcss.config.mjs"];
const SOURCE_FILE = /\.(tsx?|mjs|mts|cjs|js)$/;
const DIRECTIVE = /^["'](use client|use server)["'];?$/;
const HEADER = /^\/\/ \S.*\.$/;
const HEX_COLOUR = /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;
const VIETNAMESE =
  /[\u00C0-\u00C3\u00C8-\u00CA\u00CC\u00CD\u00D2-\u00D5\u00D9\u00DA\u00DD\u00E0-\u00E3\u00E8-\u00EA\u00EC\u00ED\u00F2-\u00F5\u00F9\u00FA\u00FD\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01A0\u01A1\u01AF\u01B0\u1EA0-\u1EF9]/;

function* listSourceFiles(directory) {
  let names;
  try {
    names = readdirSync(directory);
  } catch {
    // A scanned directory may not exist yet (for example tests/ before the first e2e test).
    return;
  }
  for (const name of names) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) yield* listSourceFiles(path);
    else if (SOURCE_FILE.test(name) && !name.endsWith(".d.ts")) yield path;
  }
}

function checkHeader(lines) {
  let index = 0;
  while (index < lines.length && DIRECTIVE.test(lines[index].trim())) index += 1;
  if (!HEADER.test(lines[index] ?? "")) return "missing one-line header comment ending with a period";
  if ((lines[index + 1] ?? "").startsWith("//")) return "header comment must be a single line";
  return null;
}

const problems = [];
const files = [
  ...SCANNED_DIRECTORIES.flatMap((directory) => [...listSourceFiles(join(ROOT, directory))]),
  ...ROOT_FILES.map((name) => join(ROOT, name)).filter((path) => {
    try {
      return statSync(path).isFile();
    } catch {
      // Optional root config files are skipped when absent.
      return false;
    }
  }),
];
for (const file of files) {
  const where = relative(ROOT, file);
  const lines = readFileSync(file, "utf8").split("\n");
  const headerProblem = checkHeader(lines);
  if (headerProblem) problems.push(`${where}:1  ${headerProblem}`);
  lines.forEach((line, index) => {
    if (VIETNAMESE.test(line)) problems.push(`${where}:${index + 1}  non-English text; move it to src/locales`);
    if (!line.trimStart().startsWith("//")) {
      for (const match of line.matchAll(HEX_COLOUR)) problems.push(`${where}:${index + 1}  hex colour ${match[0]}; use a token`);
    }
  });
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} source rule violation(s).`);
  process.exit(1);
}
console.log(`check-source-rules: ${files.length} files clean`);
