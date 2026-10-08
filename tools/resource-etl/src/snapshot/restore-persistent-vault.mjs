import path from "node:path";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import {
  writeResourceToVault,
  mergeVaultCatalog,
  writePortableBundle,
  writeThirdPartyNotices
} from "../vault/store.mjs";
import { buildVaultPreviews } from "../preview/build-preview.mjs";
import { buildReactVaultPreviews } from "../preview/react-compiler.mjs";
import { buildVaultGallery } from "../gallery/build-gallery.mjs";

const DEFAULT_BASE_URL =
  "https://raw.githubusercontent.com/decrackpichon-gif/NagWeb/resource-vault-data";

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

function selectedIds(value) {
  if (!value) return null;
  return new Set(
    String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

async function remoteBytes(baseUrl, relativePath) {
  const url =
    String(baseUrl).replace(/\/$/, "") +
    "/" +
    relativePath
      .split("/")
      .map(encodeURIComponent)
      .join("/");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "NagWeb-Resource-Vault-Restore/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(
      `Snapshot fetch failed ${response.status}: ${relativePath}`
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

async function createReader({ sourceDir, baseUrl }) {
  if (sourceDir) {
    const root = path.resolve(sourceDir);
    return async (relativePath) =>
      readFile(path.join(root, ...relativePath.split("/")));
  }

  return async (relativePath) =>
    remoteBytes(baseUrl || DEFAULT_BASE_URL, relativePath);
}

const args = parseArgs(process.argv.slice(2));
const rootDir = path.resolve(process.cwd(), String(args.out || "vault-restored"));
const readSnapshot = await createReader({
  sourceDir: args["source-dir"] ? String(args["source-dir"]) : null,
  baseUrl: args["base-url"] ? String(args["base-url"]) : DEFAULT_BASE_URL
});

console.log("NagWeb Persistent Vault Restore");
console.log(
  args["source-dir"]
    ? `Source: local ${path.resolve(String(args["source-dir"]))}`
    : `Source: ${String(args["base-url"] || DEFAULT_BASE_URL)}`
);
console.log(`Destination: ${rootDir}`);

const globalManifest = JSON.parse(
  (await readSnapshot("vault-manifest.json")).toString("utf8")
);
const wanted = selectedIds(args.snapshots);
const snapshots = (globalManifest.snapshots || []).filter(
  (snapshot) => !wanted || wanted.has(snapshot.id)
);

if (!snapshots.length) {
  throw new Error("No matching snapshots selected.");
}

const resourcesById = new Map();
const verified = [];

for (const snapshot of snapshots) {
  console.log(
    `\n[${snapshot.id}] downloading/verifying ${snapshot.count} resources...`
  );

  const compressed = await readSnapshot(snapshot.libraryPath);
  const actualSha = sha256(compressed);

  if (!snapshot.sha256 || actualSha !== snapshot.sha256) {
    throw new Error(
      `Snapshot checksum mismatch for ${snapshot.id}: expected ${snapshot.sha256}, got ${actualSha}`
    );
  }

  const decoded = gunzipSync(compressed);
  const payload = JSON.parse(decoded.toString("utf8"));
  const resources = payload.resources || [];

  if (resources.length !== snapshot.count) {
    throw new Error(
      `Snapshot count mismatch for ${snapshot.id}: manifest=${snapshot.count}, library=${resources.length}`
    );
  }

  for (const resource of resources) {
    if (!resource?.id) continue;
    resourcesById.set(resource.id, resource);
  }

  verified.push({
    id: snapshot.id,
    count: resources.length,
    sha256: actualSha,
    compressedBytes: compressed.length
  });

  console.log(
    `[${snapshot.id}] verified ${resources.length} · SHA-256 OK`
  );
}

await mkdir(rootDir, { recursive: true });

const entries = [];
for (const resource of [...resourcesById.values()].sort((a, b) =>
  a.id.localeCompare(b.id)
)) {
  entries.push(await writeResourceToVault(rootDir, resource));
}

const catalog = await mergeVaultCatalog(rootDir, entries);
const staticPreview = await buildVaultPreviews(rootDir, catalog);
const reactPreview = args["react-previews"]
  ? await buildReactVaultPreviews(rootDir, catalog, {
      max: args["react-preview-limit"]
        ? Number.parseInt(args["react-preview-limit"], 10)
        : Infinity
    })
  : { ready: 0, deferred: 0 };

const gallery = await buildVaultGallery(rootDir, catalog);
const bundlePath = await writePortableBundle(rootDir, catalog);
const noticesPath = await writeThirdPartyNotices(rootDir, catalog);

const report = {
  schemaVersion: "1.0",
  restoredAt: new Date().toISOString(),
  source: args["source-dir"]
    ? { type: "local", path: path.resolve(String(args["source-dir"])) }
    : {
        type: "nagweb-persistent-branch",
        baseUrl: String(args["base-url"] || DEFAULT_BASE_URL)
      },
  snapshots: verified,
  resources: catalog.count,
  staticPreviewsReady: staticPreview.built,
  reactPreviewsReady: reactPreview.ready,
  reactPreviewsDeferred: reactPreview.deferred,
  gallery: gallery.outputPath,
  portableBundle: bundlePath,
  notices: noticesPath
};

await writeFile(
  path.join(rootDir, "restore-report.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

console.log("");
console.log(`Restored resources: ${catalog.count}`);
console.log(`Static previews ready: ${staticPreview.built}`);
if (args["react-previews"]) {
  console.log(
    `React previews: ${reactPreview.ready} ready, ${reactPreview.deferred} deferred`
  );
}
console.log(`Gallery: ${gallery.outputPath}`);
console.log("Integrity: all selected snapshot SHA-256 checks passed.");
