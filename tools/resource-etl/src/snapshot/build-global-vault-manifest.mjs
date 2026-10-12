import path from "node:path";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

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

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

const args = parseArgs(process.argv.slice(2));
const root = path.resolve(String(args.root || ""));

if (!args.root) throw new Error("--root is required");

const snapshots = [
  {
    id: "uiverse",
    title: "Uiverse Galaxy",
    dir: path.join(root, "uiverse"),
    countKey: "autonomousResources"
  },
  {
    id: "lucide",
    title: "Lucide Icons",
    dir: path.join(root, "lucide"),
    countKey: "resourceCount"
  },
  {
    id: "heroicons",
    title: "Heroicons 24px Outline",
    dir: path.join(root, "heroicons"),
    countKey: "resourceCount"
  },
  {
    id: "threejs-code",
    title: "Three.js code-only",
    dir: path.join(root, "threejs-code"),
    countKey: "codeOnlyResources"
  },
  {
    id: "core-code",
    title: "Core Code Vault",
    dir: path.join(root, "core-code"),
    countKey: "resourceCount"
  }
];

// Historical full-refresh workflows build the four original sources from
// scratch. Preserve the separately published Heroicons snapshot rather than
// silently replacing the persistent catalog with a smaller one. Failure to
// retrieve or verify an existing fifth snapshot must STOP publication.
async function preservePublishedHeroicons() {
  const heroDir = path.join(root, "heroicons");
  if (existsSync(path.join(heroDir, "manifest.json"))) return;
  const branch = "https://raw.githubusercontent.com/decrackpichon-gif/NagWeb/resource-vault-data/";
  const request = async relativePath => {
    const response = await fetch(branch + relativePath, {
      headers: { "User-Agent": "NagWeb-Resource-Vault-Snapshot/1.0" },
      signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) throw new Error("Persistent Heroicons preservation failed: HTTP " +
      response.status + " for " + relativePath);
    const data = Buffer.from(await response.arrayBuffer());
    if (data.length > 15 * 1024 * 1024) throw new Error("Heroicons snapshot file exceeds safe limit.");
    return data;
  };
  const remote = JSON.parse((await request("vault-manifest.json")).toString("utf8"));
  const registered = remote.snapshots?.find(item => item.id === "heroicons");
  if (!registered) return; // Data branch has not yet gained the optional provider.
  const data = new Map();
  for (const file of ["manifest.json", "library.json.gz", "catalog.json",
                      "LICENSE", "skipped.json", "README.md"]) {
    data.set(file, await request("heroicons/" + file));
  }
  const details = JSON.parse(data.get("manifest.json").toString("utf8"));
  if (details.resourceCount !== registered.count ||
      details.compressedSha256 !== registered.sha256 ||
      !/^[a-f0-9]{64}$/.test(registered.sha256 || "")) {
    throw new Error("Existing Heroicons snapshot manifest does not match global Vault.");
  }
  const { createHash } = await import("node:crypto");
  const actual = createHash("sha256").update(data.get("library.json.gz")).digest("hex");
  if (actual !== registered.sha256) {
    throw new Error("Existing Heroicons snapshot checksum mismatch. Refusing to erase it.");
  }
  const { mkdir } = await import("node:fs/promises");
  await mkdir(heroDir, { recursive: true });
  for (const [file, bytes] of data) {
    await writeFile(path.join(heroDir, file), bytes);
  }
  console.log("Preserved published Heroicons snapshot:", registered.count);
}
await preservePublishedHeroicons();

const items = [];
for (const snapshot of snapshots) {
  // Backwards-compatible with a data branch that predates Heroicons.
  if (snapshot.id === "heroicons" && !existsSync(path.join(snapshot.dir, "manifest.json"))) continue;
  const manifest = await readJson(path.join(snapshot.dir, "manifest.json"));
  const count = Number(manifest[snapshot.countKey] || 0);
  items.push({
    id: snapshot.id,
    title: snapshot.title,
    count,
    compressedBytes: Number(manifest.compressedBytes || 0),
    uncompressedBytes: Number(manifest.uncompressedBytes || 0),
    sha256: manifest.compressedSha256 || null,
    sourceCommit:
      manifest.sourceCommit ||
      manifest.source?.commit ||
      null,
    sourceCommits: manifest.sourceCommits || null,
    providers:
      manifest.providers ||
      [manifest.provider].filter(Boolean),
    manifestPath: `${snapshot.id}/manifest.json`,
    libraryPath: `${snapshot.id}/library.json.gz`
  });
}

const globalManifest = {
  schemaVersion: "1.0",
  format: "nagweb-resource-vault-index",
  generatedAt: new Date().toISOString(),
  totalResources: items.reduce((sum, item) => sum + item.count, 0),
  totalCompressedBytes: items.reduce(
    (sum, item) => sum + item.compressedBytes,
    0
  ),
  totalUncompressedBytes: items.reduce(
    (sum, item) => sum + item.uncompressedBytes,
    0
  ),
  snapshotCount: items.length,
  snapshots: items
};

await writeFile(
  path.join(root, "vault-manifest.json"),
  JSON.stringify(globalManifest, null, 2) + "\n",
  "utf8"
);

const rows = items
  .map(
    (item) =>
      `| ${item.title} | ${item.count.toLocaleString("en-US")} | ${(
        item.compressedBytes /
        1024 /
        1024
      ).toFixed(2)} MiB |`
  )
  .join("\n");

const readme = `# NagWeb Resource Vault Data

Generated persistent snapshots of lightweight resources mirrored by NagWeb under verified redistribution policies.

This branch is generated data, not application source code. It is force-refreshed so snapshot history does not grow without bound.

## Current holdings

| Snapshot | Resources | Compressed |
| --- | ---: | ---: |
${rows}
| **Total** | **${globalManifest.totalResources.toLocaleString("en-US")}** | **${(
  globalManifest.totalCompressedBytes /
  1024 /
  1024
).toFixed(2)} MiB** |

The canonical machine-readable index is vault-manifest.json. Each snapshot also carries its own manifest, source commit(s), SHA-256 checksum and license/notices.
`;

await writeFile(path.join(root, "README.md"), readme, "utf8");

console.log("NagWeb global resource manifest built");
console.log(`Snapshots: ${items.length}`);
console.log(`Resources: ${globalManifest.totalResources}`);
console.log(`Compressed bytes: ${globalManifest.totalCompressedBytes}`);
