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
import { analyzeThreeExample } from "../extractors/threejs.mjs";
import { transformThreeCodeScene } from "../light-transformers.mjs";

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
    ["-C", sourceDir, "ls-files", "-s", "examples"],
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
const outDir = path.resolve(String(args["out-dir"] || "threejs-code-snapshot"));
const commit = String(args.commit || "").trim();

if (!args["source-dir"]) throw new Error("--source-dir is required");
if (!commit) throw new Error("--commit is required");

await mkdir(outDir, { recursive: true });

const examplesDir = path.join(sourceDir, "examples");
const filenames = (await readdir(examplesDir))
  .filter((name) => name.endsWith(".html") && name !== "index.html")
  .sort((a, b) => a.localeCompare(b));

const blobShas = gitBlobMap(sourceDir);
const resources = [];
const rejected = [];

for (const filename of filenames) {
  const relativePath = `examples/${filename}`;
  const html = await readFile(path.join(examplesDir, filename), "utf8");
  const analysis = analyzeThreeExample(html);

  if (!analysis.codeOnly) {
    rejected.push({
      path: relativePath,
      reasons: analysis.reasons
    });
    continue;
  }

  resources.push(
    transformThreeCodeScene({
      repository: "https://github.com/mrdoob/three.js",
      commit,
      item: {
        path: relativePath,
        sha: blobShas.get(relativePath),
        html,
        analysis
      }
    })
  );
}

resources.sort((a, b) => a.id.localeCompare(b.id));

const generatedAt = new Date().toISOString();
const snapshot = {
  format: "nagweb-provider-snapshot",
  version: "1.0",
  provider: "threejs",
  generatedAt,
  source: {
    repository: "https://github.com/mrdoob/three.js",
    commit
  },
  totalScanned: filenames.length,
  count: resources.length,
  rejectedCount: rejected.length,
  resources
};

const jsonBuffer = Buffer.from(JSON.stringify(snapshot), "utf8");
const gzipBuffer = gzipSync(jsonBuffer, { level: 9 });
await writeFile(path.join(outDir, "library.json.gz"), gzipBuffer);

const catalog = {
  schemaVersion: "1.0",
  provider: "threejs",
  sourceCommit: commit,
  generatedAt,
  totalScanned: filenames.length,
  count: resources.length,
  rejectedCount: rejected.length,
  resources: resources.map(stripArtifactContent)
};
await writeFile(
  path.join(outDir, "catalog.json"),
  JSON.stringify(catalog, null, 2) + "\n",
  "utf8"
);

await writeFile(
  path.join(outDir, "rejected.json"),
  JSON.stringify(rejected, null, 2) + "\n",
  "utf8"
);

const manifest = {
  schemaVersion: "1.0",
  provider: "threejs",
  policy: "code-only",
  sourceRepository: snapshot.source.repository,
  sourceCommit: commit,
  generatedAt,
  totalScanned: filenames.length,
  codeOnlyResources: resources.length,
  rejectedResources: rejected.length,
  uncompressedBytes: jsonBuffer.length,
  compressedBytes: gzipBuffer.length,
  compressedSha256: sha256(gzipBuffer),
  files: {
    library: "library.json.gz",
    catalog: "catalog.json",
    rejected: "rejected.json",
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
    "# NagWeb Three.js Code-only Snapshot",
    "",
    `- Source commit: \`${commit}\``,
    `- Examples scanned: ${filenames.length}`,
    `- Code-only resources: ${resources.length}`,
    `- Rejected because of external assets/data: ${rejected.length}`,
    `- Compressed bytes: ${gzipBuffer.length}`,
    `- SHA-256: \`${manifest.compressedSha256}\``,
    "",
    "Only example source that passes NagWeb's static code-only filter is mirrored. Models, textures, HDR/EXR, media, external data and remote fetches remain excluded.",
    ""
  ].join("\n"),
  "utf8"
);

console.log("NagWeb Three.js code-only snapshot built");
console.log(`Scanned: ${filenames.length}`);
console.log(`Code-only: ${resources.length}`);
console.log(`Rejected: ${rejected.length}`);
console.log(`Gzip bytes: ${gzipBuffer.length}`);
console.log(`SHA-256: ${manifest.compressedSha256}`);
