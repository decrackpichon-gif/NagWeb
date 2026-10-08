import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import {
  mkdir,
  readFile,
  readdir,
  writeFile
} from "node:fs/promises";
import { transformLucideIcon } from "../light-transformers.mjs";

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

function stripArtifactContent(resource) {
  return {
    ...resource,
    artifacts: (resource.artifacts || []).map(({ content, ...artifact }) => artifact)
  };
}

function gitBlobMap(sourceDir) {
  const output = execFileSync(
    "git",
    ["-C", sourceDir, "ls-files", "-s", "icons"],
    { encoding: "utf8" }
  );
  const map = new Map();
  for (const line of output.split("\n")) {
    if (!line.trim()) continue;
    const match = line.match(/^\d+\s+([0-9a-f]+)\s+\d+\t(.+)$/);
    if (match) map.set(match[2], match[1]);
  }
  return map;
}

const args = parseArgs(process.argv.slice(2));
const sourceDir = path.resolve(String(args["source-dir"] || ""));
const outDir = path.resolve(String(args["out-dir"] || "lucide-snapshot"));
const commit = String(args.commit || "").trim();

if (!args["source-dir"]) throw new Error("--source-dir is required");
if (!commit) throw new Error("--commit is required");

await mkdir(outDir, { recursive: true });

const iconsDir = path.join(sourceDir, "icons");
const names = await readdir(iconsDir);
const groups = new Map();

for (const filename of names) {
  const match = filename.match(/^(.+)\.(svg|json)$/);
  if (!match) continue;
  const [, name, ext] = match;
  if (!groups.has(name)) groups.set(name, {});
  groups.get(name)[ext] = filename;
}

const blobShas = gitBlobMap(sourceDir);
const resources = [];

for (const name of [...groups.keys()].sort((a,b)=>a.localeCompare(b))) {
  const pair = groups.get(name);
  if (!pair.svg || !pair.json) continue;

  const svgPath = path.join(iconsDir, pair.svg);
  const metaPath = path.join(iconsDir, pair.json);
  const [svg, metaText] = await Promise.all([
    readFile(svgPath, "utf8"),
    readFile(metaPath, "utf8")
  ]);
  const meta = JSON.parse(metaText);
  const svgRepoPath = `icons/${pair.svg}`;
  const metaRepoPath = `icons/${pair.json}`;

  resources.push(
    transformLucideIcon({
      item: {
        name,
        meta,
        svg,
        svgSha: blobShas.get(svgRepoPath),
        metaSha: blobShas.get(metaRepoPath)
      },
      commit
    })
  );
}

const generatedAt = new Date().toISOString();
const snapshot = {
  format: "nagweb-provider-snapshot",
  version: "1.0",
  provider: "lucide",
  generatedAt,
  source: {
    repository: "https://github.com/lucide-icons/lucide",
    commit
  },
  count: resources.length,
  resources
};

const jsonBuffer = Buffer.from(JSON.stringify(snapshot), "utf8");
const gzipBuffer = gzipSync(jsonBuffer, { level: 9 });
await writeFile(path.join(outDir, "library.json.gz"), gzipBuffer);

const catalog = {
  schemaVersion: "1.0",
  provider: "lucide",
  sourceCommit: commit,
  generatedAt,
  count: resources.length,
  resources: resources.map(stripArtifactContent)
};
await writeFile(
  path.join(outDir, "catalog.json"),
  JSON.stringify(catalog, null, 2) + "\n",
  "utf8"
);

const manifest = {
  schemaVersion: "1.0",
  provider: "lucide",
  sourceRepository: snapshot.source.repository,
  sourceCommit: commit,
  generatedAt,
  resourceCount: resources.length,
  uncompressedBytes: jsonBuffer.length,
  compressedBytes: gzipBuffer.length,
  compressedSha256: sha256(gzipBuffer),
  files: {
    library: "library.json.gz",
    catalog: "catalog.json",
    license: "LICENSE"
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
    "# NagWeb Lucide Snapshot",
    "",
    `- Source commit: \`${commit}\``,
    `- Icons: ${resources.length}`,
    `- Compressed bytes: ${gzipBuffer.length}`,
    `- SHA-256: \`${manifest.compressedSha256}\``,
    "",
    "The compressed library contains complete UniversalResource records with SVG source and Lucide metadata.",
    ""
  ].join("\n"),
  "utf8"
);

console.log("NagWeb Lucide snapshot built");
console.log(`Icons: ${resources.length}`);
console.log(`JSON bytes: ${jsonBuffer.length}`);
console.log(`Gzip bytes: ${gzipBuffer.length}`);
console.log(`SHA-256: ${manifest.compressedSha256}`);
