import path from "node:path";
import { createHash } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import { extractHeroicons } from "../extractors/heroicons.mjs";
import { transformHeroiconOutline } from "../heroicons-transformer.mjs";
import { assertFullMirrorAllowed } from "../vault/source-policies.mjs";

const sha256 = buf => createHash("sha256").update(buf).digest("hex");
const outFlag = process.argv.find(arg => arg.startsWith("--out-dir="));
const outDir = path.resolve(outFlag?.slice("--out-dir=".length) || "heroicons-snapshot");
assertFullMirrorAllowed("heroicons");

const extracted = await extractHeroicons({ all: true });
if (extracted.items.length < 250) {
  throw new Error("Too few validated Heroicons outlines: " + extracted.items.length +
    "/" + extracted.totalAvailable + ". Refusing to publish incomplete snapshot.");
}
const resources = extracted.items.map(item => transformHeroiconOutline({
  item, commit: extracted.commit, licenseText: extracted.licenseText
}));
const ids = new Set(resources.map(item => item.id));
if (ids.size !== resources.length) throw new Error("Heroicons resource IDs are not unique.");
resources.sort((a, b) => a.id.localeCompare(b.id));
const generatedAt = new Date().toISOString();
const bundle = {
  format: "nagweb-provider-snapshot", version: "1.0", provider: "heroicons",
  generatedAt,
  source: { repository: extracted.repository, commit: extracted.commit },
  count: resources.length, resources
};
const raw = Buffer.from(JSON.stringify(bundle), "utf8");
const compressed = gzipSync(raw, { level: 9 });
const restored = JSON.parse(gunzipSync(compressed).toString("utf8"));
if (restored.resources.length !== resources.length) throw new Error("Heroicons gzip round-trip failed.");
const manifest = {
  schemaVersion: "1.0",
  provider: "heroicons",
  sourceRepository: extracted.repository,
  sourceCommit: extracted.commit,
  generatedAt,
  availableOutlines: extracted.totalAvailable,
  skippedOutlines: extracted.skipped.length,
  resourceCount: resources.length,
  uncompressedBytes: raw.length,
  compressedBytes: compressed.length,
  compressedSha256: sha256(compressed),
  files: {
    library: "library.json.gz", catalog: "catalog.json",
    license: "LICENSE", skipped: "skipped.json"
  }
};
const stripContent = resource => ({
  ...resource, artifacts: resource.artifacts.map(({content, ...artifact}) => artifact)
});
const catalog = {
  schemaVersion: "1.0", provider: "heroicons", sourceCommit: extracted.commit,
  generatedAt, count: resources.length, resources: resources.map(stripContent)
};
await mkdir(outDir, {recursive: true});
await Promise.all([
  writeFile(path.join(outDir, "library.json.gz"), compressed),
  writeFile(path.join(outDir, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n"),
  writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n"),
  writeFile(path.join(outDir, "LICENSE"), extracted.licenseText),
  writeFile(path.join(outDir, "skipped.json"), JSON.stringify(extracted.skipped, null, 2) + "\n"),
  writeFile(path.join(outDir, "README.md"), [
    "# Heroicons editable outlines | NagWeb persistent Vault", "",
    "Source: " + extracted.repository,
    "Pinned source commit: " + extracted.commit,
    "Variant: optimized/24/outline",
    "License: MIT (LICENSE; original notices included per resource)",
    "Validated resources: " + resources.length,
    "Skipped incompatible SVGs: " + extracted.skipped.length,
    "Library SHA-256: " + manifest.compressedSha256,
    "",
    "SVGs preserve original upstream.svg, normalized editable icon.svg, license and provenance.",
    "Only strictly validated stroked 24px outlines are published; no filled variants.",
    ""
  ].join("\n"))
]);
console.log("Heroicons full persistent snapshot built:", resources.length,
  "/", extracted.totalAvailable, "SHA-256", manifest.compressedSha256);
