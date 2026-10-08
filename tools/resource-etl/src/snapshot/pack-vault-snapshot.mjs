import path from "node:path";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import {
  mkdir,
  readFile,
  writeFile
} from "node:fs/promises";

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

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

const args = parseArgs(process.argv.slice(2));
const vaultDir = path.resolve(String(args["vault-dir"] || ""));
const outDir = path.resolve(String(args["out-dir"] || "snapshot"));
const name = String(args.name || "code-vault");

if (!args["vault-dir"]) {
  throw new Error("--vault-dir is required");
}

await mkdir(outDir, { recursive: true });

const bundleBuffer = await readFile(
  path.join(vaultDir, "nagweb-code-library.json")
);
const bundle = JSON.parse(bundleBuffer.toString("utf8"));
const catalogBuffer = await readFile(path.join(vaultDir, "catalog.json"));
const noticesBuffer = await readFile(
  path.join(vaultDir, "THIRD_PARTY_NOTICES.txt")
);

const compressed = gzipSync(bundleBuffer, { level: 9 });
await writeFile(path.join(outDir, "library.json.gz"), compressed);
await writeFile(path.join(outDir, "catalog.json"), catalogBuffer);
await writeFile(path.join(outDir, "THIRD_PARTY_NOTICES.txt"), noticesBuffer);

const providerCounts = {};
const providerCommits = {};
for (const resource of bundle.resources || []) {
  const provider = resource.source?.provider || "unknown";
  providerCounts[provider] = (providerCounts[provider] || 0) + 1;

  const commit = resource.source?.commit;
  if (commit) {
    if (!providerCommits[provider]) providerCommits[provider] = new Set();
    providerCommits[provider].add(commit);
  }
}

const commits = Object.fromEntries(
  Object.entries(providerCommits).map(([provider, values]) => [
    provider,
    [...values].sort()
  ])
);

const manifest = {
  schemaVersion: "1.0",
  name,
  generatedAt: new Date().toISOString(),
  resourceCount: bundle.resources?.length || 0,
  providers: Object.keys(providerCounts).sort(),
  providerCounts,
  sourceCommits: commits,
  uncompressedBytes: bundleBuffer.length,
  compressedBytes: compressed.length,
  compressedSha256: sha256(compressed),
  files: {
    library: "library.json.gz",
    catalog: "catalog.json",
    notices: "THIRD_PARTY_NOTICES.txt"
  }
};

await writeFile(
  path.join(outDir, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
  "utf8"
);

await writeFile(
  path.join(outDir, "README.md"),
  [
    `# NagWeb ${name} snapshot`,
    "",
    `Resources: ${manifest.resourceCount}`,
    `Providers: ${manifest.providers.join(", ")}`,
    `Compressed bytes: ${manifest.compressedBytes}`,
    `SHA-256: \`${manifest.compressedSha256}\``,
    "",
    "The compressed library contains the complete NagWeb UniversalResource records, including mirrored source code when the provider policy permits redistribution.",
    ""
  ].join("\n"),
  "utf8"
);

console.log("NagWeb compact Vault snapshot built");
console.log(`Resources: ${manifest.resourceCount}`);
console.log(`Providers: ${manifest.providers.join(", ")}`);
console.log(`Gzip bytes: ${manifest.compressedBytes}`);
console.log(`SHA-256: ${manifest.compressedSha256}`);
