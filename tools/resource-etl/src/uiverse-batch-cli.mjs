import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extractUiverseComponents } from "./extractors/uiverse.mjs";
import { transformUiverseComponent } from "./light-transformers.mjs";
import {
  writeResourceToVault,
  mergeVaultCatalog,
  writePortableBundle,
  writeThirdPartyNotices
} from "./vault/store.mjs";
import { buildVaultPreviews } from "./preview/build-preview.mjs";
import { buildVaultGallery } from "./gallery/build-gallery.mjs";
import { assertFullMirrorAllowed } from "./vault/source-policies.mjs";

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

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function nonNegativeInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function checkpointName(category) {
  if (!category) return "uiverse-checkpoint.json";
  const slug = String(category)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `uiverse-checkpoint-${slug || "category"}.json`;
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

const args = parseArgs(process.argv.slice(2));
const rootDir = path.resolve(process.cwd(), String(args.out || "vault"));
const category = args.category ? String(args.category) : null;
const limit = positiveInt(args.limit, 100);
const checkpointPath = path.join(rootDir, checkpointName(category));

assertFullMirrorAllowed("uiverse");
await mkdir(rootDir, { recursive: true });

const checkpoint = args.resume
  ? await readJson(checkpointPath, null)
  : null;

const explicitOffset =
  args.offset !== undefined
    ? nonNegativeInt(args.offset, 0)
    : args["uiverse-offset"] !== undefined
      ? nonNegativeInt(args["uiverse-offset"], 0)
      : null;

const startOffset =
  explicitOffset !== null
    ? explicitOffset
    : checkpoint?.nextOffset ?? 0;

console.log("NagWeb Uiverse Batch Importer");
console.log(`Destination: ${rootDir}`);
console.log(`Category: ${category || "all"}`);
console.log(`Start offset: ${startOffset}`);
console.log(`Target autonomous resources: ${limit}`);

const raw = await extractUiverseComponents({
  limit,
  offset: startOffset,
  category: category || undefined
});

const resources = raw.items.map((item) =>
  transformUiverseComponent({
    repository: raw.repository,
    commit: raw.commit,
    item
  })
);

const entries = [];
for (const resource of resources) {
  entries.push(await writeResourceToVault(rootDir, resource));
}

const catalog = await mergeVaultCatalog(rootDir, entries);
const previewResult = await buildVaultPreviews(rootDir, catalog);
const galleryResult = await buildVaultGallery(rootDir, catalog);
const bundlePath = await writePortableBundle(rootDir, catalog);
const noticesPath = await writeThirdPartyNotices(rootDir, catalog);

const providerCount = (catalog.resources || []).filter(
  (entry) => entry.source?.provider === "uiverse"
).length;

const complete =
  raw.nextOffset >= raw.totalAvailable ||
  raw.items.length === 0;

const nextCheckpoint = {
  schemaVersion: "1.0",
  provider: "uiverse",
  category,
  sourceCommit: raw.commit,
  totalAvailable: raw.totalAvailable,
  startOffset: raw.startOffset,
  nextOffset: raw.nextOffset,
  scannedThisBatch: raw.scanned,
  importedThisBatch: resources.length,
  importedInVault: providerCount,
  skippedThisBatch: raw.skipped.length,
  complete,
  updatedAt: new Date().toISOString()
};

await writeFile(
  checkpointPath,
  JSON.stringify(nextCheckpoint, null, 2) + "\n",
  "utf8"
);

console.log("");
console.log(`Imported this batch: ${resources.length}`);
console.log(`Uiverse resources in Vault: ${providerCount}`);
console.log(`Scanned offset: ${raw.startOffset} -> ${raw.nextOffset}`);
console.log(`Skipped this batch: ${raw.skipped.length}`);
console.log(`Static previews ready: ${previewResult.built}`);
console.log(`Gallery: ${galleryResult.outputPath}`);
console.log(`Portable bundle: ${bundlePath}`);
console.log(`Notices: ${noticesPath}`);
console.log(`Checkpoint: ${checkpointPath}`);
console.log(
  complete
    ? "Uiverse import is complete for this scope."
    : "Checkpoint saved. Run the same command with --resume to continue."
);
