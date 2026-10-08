import path from "node:path";
import { createHash } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";
import { mkdir, readFile, writeFile } from "node:fs/promises";

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

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

const args = parseArgs(process.argv.slice(2));
const root = path.resolve(String(args.root || ""));
if (!args.root) throw new Error("--root is required");

const globalPath = path.join(root, "vault-manifest.json");
const globalManifest = await readJson(globalPath);
const resourcesById = new Map();
const originById = new Map();
const sourceSnapshots = [];

for (const snapshot of globalManifest.snapshots || []) {
  const compressed = await readFile(path.join(root, snapshot.libraryPath));
  const actualSha = sha256(compressed);

  if (!snapshot.sha256 || actualSha !== snapshot.sha256) {
    throw new Error(
      `Snapshot checksum mismatch for ${snapshot.id}: expected ${snapshot.sha256}, got ${actualSha}`
    );
  }

  const payload = JSON.parse(gunzipSync(compressed).toString("utf8"));
  const resources = payload.resources || [];

  if (resources.length !== snapshot.count) {
    throw new Error(
      `Snapshot count mismatch for ${snapshot.id}: manifest=${snapshot.count}, library=${resources.length}`
    );
  }

  for (const resource of resources) {
    if (!resource?.id) continue;
    if (resourcesById.has(resource.id)) {
      throw new Error("Duplicate resource ID across persistent snapshots: " + resource.id + " (" + originById.get(resource.id) + " and " + snapshot.id + ")");
    }
    resourcesById.set(resource.id, resource);
    originById.set(resource.id, snapshot.id);
  }

  sourceSnapshots.push({
    id: snapshot.id,
    count: resources.length,
    sha256: actualSha
  });
}

const resources = [...resourcesById.values()].sort((a, b) =>
  a.id.localeCompare(b.id)
);

const bundle = {
  schemaVersion: "1.0",
  format: "nagweb-resource-vault-bundle",
  generatedAt: new Date().toISOString(),
  resourceCount: resources.length,
  resources
};

const browseResources = resources.map((resource) => ({
  id: resource.id,
  slug: resource.slug,
  name: resource.name,
  title: resource.title,
  description: resource.description || "",
  family: resource.family,
  kind: resource.kind,
  provider: resource.source?.provider || "unknown",
  author: resource.source?.author || null,
  license: resource.license?.id || "unknown",
  categories: resource.taxonomy?.categories || [],
  tags: resource.taxonomy?.tags || [],
  capabilities: resource.capabilities || [],
  searchText: resource.search?.text || "",
  sourceCommit: resource.source?.commit || null
}));

const browseIndex = {
  schemaVersion: "1.0",
  format: "nagweb-resource-browse-index",
  generatedAt: bundle.generatedAt,
  resourceCount: browseResources.length,
  resources: browseResources
};

const bundleBuffer = Buffer.from(JSON.stringify(bundle), "utf8");
const browseBuffer = Buffer.from(JSON.stringify(browseIndex), "utf8");
const bundleGzip = gzipSync(bundleBuffer, { level: 9 });
const browseGzip = gzipSync(browseBuffer, { level: 9 });

const outDir = path.join(root, "all");
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "library.json.gz"), bundleGzip);
await writeFile(path.join(outDir, "browse-index.json.gz"), browseGzip);

const providers = [...new Set(
  resources.map((resource) => resource.source?.provider || "unknown")
)].sort();

const manifest = {
  schemaVersion: "1.0",
  name: "all",
  generatedAt: bundle.generatedAt,
  resourceCount: resources.length,
  providers,
  sourceSnapshots,
  uncompressedBytes: bundleBuffer.length,
  compressedBytes: bundleGzip.length,
  compressedSha256: sha256(bundleGzip),
  browseIndexBytes: browseGzip.length,
  browseIndexSha256: sha256(browseGzip),
  files: {
    library: "library.json.gz",
    browseIndex: "browse-index.json.gz"
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
    "# NagWeb consolidated resource vault",
    "",
    `Resources: ${manifest.resourceCount}`,
    `Providers: ${manifest.providers.join(", ")}`,
    `Library compressed bytes: ${manifest.compressedBytes}`,
    `Browse index compressed bytes: ${manifest.browseIndexBytes}`,
    `Library SHA-256: \`${manifest.compressedSha256}\``,
    `Browse index SHA-256: \`${manifest.browseIndexSha256}\``,
    "",
    "library.json.gz contains the complete UniversalResource records.",
    "browse-index.json.gz contains lightweight metadata for fast browsing and search.",
    ""
  ].join("\n"),
  "utf8"
);

globalManifest.consolidated = {
  id: "all",
  title: "NagWeb Complete Lightweight Vault",
  count: manifest.resourceCount,
  providers,
  compressedBytes: manifest.compressedBytes,
  uncompressedBytes: manifest.uncompressedBytes,
  sha256: manifest.compressedSha256,
  libraryPath: "all/library.json.gz",
  manifestPath: "all/manifest.json",
  browseIndexPath: "all/browse-index.json.gz",
  browseIndexBytes: manifest.browseIndexBytes,
  browseIndexSha256: manifest.browseIndexSha256
};

await writeFile(
  globalPath,
  JSON.stringify(globalManifest, null, 2) + "\n",
  "utf8"
);

const readmePath = path.join(root, "README.md");
const existingReadme = await readFile(readmePath, "utf8");
await writeFile(
  readmePath,
  existingReadme +
    [
      "",
      "## One-file restore",
      "",
      `The complete lightweight Vault is also available as one verified bundle: \`all/library.json.gz\` (${manifest.resourceCount.toLocaleString("en-US")} resources).`,
      "",
      "For fast catalog browsing without loading source code, use `all/browse-index.json.gz`.",
      ""
    ].join("\n"),
  "utf8"
);

console.log("NagWeb consolidated Vault built");
console.log(`Resources: ${manifest.resourceCount}`);
console.log(`Providers: ${providers.length}`);
console.log(`Library gzip bytes: ${manifest.compressedBytes}`);
console.log(`Browse index gzip bytes: ${manifest.browseIndexBytes}`);
