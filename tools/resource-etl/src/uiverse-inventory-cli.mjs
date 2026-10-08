import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { getUiverseInventory } from "./extractors/uiverse.mjs";

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const token = arg.slice(2);
    const eq = token.indexOf("=");
    if (eq === -1) out[token] = true;
    else out[token.slice(0, eq)] = token.slice(eq + 1);
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const outDir = path.resolve(process.cwd(), String(args.out || "vault"));
const inventory = await getUiverseInventory({
  category: args.category ? String(args.category) : undefined
});

await mkdir(outDir, { recursive: true });
const outputPath = path.join(outDir, "uiverse-inventory.json");
await writeFile(
  outputPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      ...inventory
    },
    null,
    2
  ) + "\n",
  "utf8"
);

console.log(`Uiverse inventory: ${inventory.totalAvailable} candidates`);
console.log(`Saved: ${outputPath}`);
