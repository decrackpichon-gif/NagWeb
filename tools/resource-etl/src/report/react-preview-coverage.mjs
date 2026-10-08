import { readFile } from "node:fs/promises";

function argValue(name) {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

const file = argValue("file") || process.argv[2];
if (!file) {
  console.error("Usage: node src/report/react-preview-coverage.mjs --file=react-preview-audit.json");
  process.exit(2);
}

const audit = JSON.parse(await readFile(file, "utf8"));
const provider = argValue("provider");
const allItems = audit.items || [];
const items = provider
  ? allItems.filter((item) =>
      String(item.resourceId || "").startsWith(`${provider}:`)
    )
  : allItems;
const ready = items.filter((item) => item.ok);
const deferred = items.filter((item) => !item.ok);

const reasonCounts = new Map();
const dependencyCounts = new Map();

for (const item of deferred) {
  const reason = String(item.reason || "unknown");
  reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);

  const packages = item.audit?.npmPackages || [];
  for (const pkg of packages) {
    if (
      reason.includes("unsupported-runtime-packages") ||
      reason.includes("npm-package-not-installed")
    ) {
      dependencyCounts.set(pkg, (dependencyCounts.get(pkg) || 0) + 1);
    }
  }
}

const percent = items.length
  ? Math.round((ready.length / items.length) * 1000) / 10
  : 0;

console.log("");
console.log(
  provider
    ? `=== React Preview Coverage · ${provider} ===`
    : "=== React Preview Coverage ==="
);
console.log(`Total auditados: ${items.length}`);
console.log(`Listos: ${ready.length}`);
console.log(`Diferidos: ${deferred.length}`);
console.log(`Coverage: ${percent}%`);

if (reasonCounts.size) {
  console.log("");
  console.log("Motivos de diferido:");
  for (const [reason, count] of [...reasonCounts.entries()].sort((a,b)=>b[1]-a[1])) {
    console.log(`  ${count}x  ${reason}`);
  }
}

if (dependencyCounts.size) {
  console.log("");
  console.log("Paquetes implicados en diferidos:");
  for (const [pkg, count] of [...dependencyCounts.entries()].sort((a,b)=>b[1]-a[1])) {
    console.log(`  ${count}x  ${pkg}`);
  }
}

console.log("");
console.log("Diferidos:");
for (const item of deferred) {
  console.log(`  - ${item.resourceId}: ${item.reason || "unknown"}`);
}
