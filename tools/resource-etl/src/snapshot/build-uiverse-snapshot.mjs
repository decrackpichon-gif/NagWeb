import path from "node:path";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import {
  mkdir,
  readFile,
  readdir,
  writeFile
} from "node:fs/promises";
import {
  parseUiverseMetadata,
  isAutonomousUiverseHtml
} from "../extractors/uiverse.mjs";
import { transformUiverseComponent } from "../light-transformers.mjs";

const CATEGORIES = [
  "Buttons",
  "Cards",
  "Checkboxes",
  "Forms",
  "Inputs",
  "Notifications",
  "Patterns",
  "Radio-buttons",
  "Toggle-switches",
  "Tooltips",
  "loaders"
];

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

function stripArtifactContent(resource) {
  return {
    ...resource,
    artifacts: (resource.artifacts || []).map(({ content, ...artifact }) => artifact)
  };
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

const args = parseArgs(process.argv.slice(2));
const sourceDir = path.resolve(String(args["source-dir"] || ""));
const outDir = path.resolve(String(args["out-dir"] || "uiverse-snapshot"));
const commit = String(args.commit || "").trim();

if (!args["source-dir"]) {
  throw new Error("--source-dir is required");
}
if (!commit) {
  throw new Error("--commit is required");
}

await mkdir(outDir, { recursive: true });

const resources = [];
const skipped = [];
let totalCandidates = 0;

for (const category of CATEGORIES) {
  const categoryDir = path.join(sourceDir, category);
  let names = [];
  try {
    names = await readdir(categoryDir);
  } catch {
    continue;
  }

  for (const name of names.filter((value) => value.endsWith(".html")).sort()) {
    totalCandidates += 1;
    const absolutePath = path.join(categoryDir, name);
    const relativePath = `${category}/${name}`;
    const content = await readFile(absolutePath, "utf8");

    if (!isAutonomousUiverseHtml(content)) {
      skipped.push({
        path: relativePath,
        reason: "external-or-script-dependency"
      });
      continue;
    }

    const metadata = parseUiverseMetadata(relativePath, content);
    const resource = transformUiverseComponent({
      repository: "https://github.com/uiverse-io/galaxy",
      commit,
      item: {
        entry: {
          path: relativePath
        },
        content,
        metadata,
        autonomous: true
      }
    });
    resources.push(resource);
  }
}

resources.sort((a, b) => a.id.localeCompare(b.id));

const duplicateIds = [];
for (let i = 1; i < resources.length; i += 1) {
  if (resources[i - 1].id === resources[i].id) duplicateIds.push(resources[i].id);
}
if (duplicateIds.length) {
  throw new Error("Duplicate Uiverse resource IDs detected: " + [...new Set(duplicateIds)].join(", "));
}

const snapshot = {
  format: "nagweb-provider-snapshot",
  version: "1.0",
  provider: "uiverse",
  generatedAt: new Date().toISOString(),
  source: {
    repository: "https://github.com/uiverse-io/galaxy",
    commit
  },
  totalCandidates,
  count: resources.length,
  skippedCount: skipped.length,
  resources
};

const jsonBuffer = Buffer.from(JSON.stringify(snapshot), "utf8");
const gzipBuffer = gzipSync(jsonBuffer, { level: 9 });
const gzipPath = path.join(outDir, "library.json.gz");
await writeFile(gzipPath, gzipBuffer);

const catalog = {
  schemaVersion: "1.0",
  provider: "uiverse",
  sourceCommit: commit,
  generatedAt: snapshot.generatedAt,
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
  provider: "uiverse",
  sourceRepository: snapshot.source.repository,
  sourceCommit: commit,
  generatedAt: snapshot.generatedAt,
  totalCandidates,
  autonomousResources: resources.length,
  skippedResources: skipped.length,
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
  path.join(outDir, "skipped.json"),
  JSON.stringify(skipped, null, 2) + "\n",
  "utf8"
);

await writeFile(
  path.join(outDir, "README.md"),
  [
    "# NagWeb Uiverse Snapshot",
    "",
    "Generated copy of autonomous Uiverse HTML/CSS resources for NagWeb.",
    "",
    `- Source commit: \`${commit}\``,
    `- Candidates: ${totalCandidates}`,
    `- Autonomous resources: ${resources.length}`,
    `- Skipped because of external/script dependencies: ${skipped.length}`,
    `- Compressed library: ${gzipBuffer.length} bytes`,
    "",
    "The compressed library contains the complete UniversalResource records, including original HTML/CSS code and provenance metadata.",
    ""
  ].join("\n"),
  "utf8"
);

console.log("NagWeb Uiverse snapshot built");
console.log(`Candidates: ${totalCandidates}`);
console.log(`Autonomous: ${resources.length}`);
console.log(`Skipped: ${skipped.length}`);
console.log(`JSON bytes: ${jsonBuffer.length}`);
console.log(`Gzip bytes: ${gzipBuffer.length}`);
console.log(`SHA-256: ${manifest.compressedSha256}`);
