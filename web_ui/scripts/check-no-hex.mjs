// Kiểm tra cấm mã màu hex trong mã nguồn src, mọi màu phải dùng token CSS.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../src", import.meta.url).pathname;
const HEX = /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(tsx|ts)$/.test(name) && !name.endsWith(".d.ts")) yield p;
  }
}

const hits = [];
for (const file of walk(ROOT)) {
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*")) return;
      for (const m of line.matchAll(HEX)) hits.push(`${relative(process.cwd(), file)}:${i + 1}  ${m[0]}`);
    });
}

if (hits.length) {
  console.error("Không dùng mã hex trong mã nguồn; khai báo token ở src/app/globals.css:\n" + hits.join("\n"));
  process.exit(1);
}
console.log("check-no-hex: sạch");
