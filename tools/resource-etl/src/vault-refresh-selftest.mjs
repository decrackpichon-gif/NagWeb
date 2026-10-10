import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { createNagWebPersistentVaultClient } from "./runtime/persistent-vault-client.mjs";

const hash = bytes => createHash("sha256").update(bytes).digest("hex");
function snapshot(version) {
  const resource = { id: `smoke:${version}`, title: version, source: { provider: "smoke" } };
  const resources = [{ id: resource.id, title: version, provider: "smoke", family: "icon", kind: "svg" }];
  const index = gzipSync(JSON.stringify({
    format: "nagweb-resource-browse-index", resourceCount: 1, resources
  }));
  const library = gzipSync(JSON.stringify({
    format: "nagweb-resource-vault-bundle", resourceCount: 1, resources: [resource]
  }));
  return {
    manifest: {
      format: "nagweb-resource-vault-index",
      consolidated: {
        count: 1,
        browseIndexPath: `${version}-index.json.gz`,
        browseIndexSha256: hash(index),
        libraryPath: `${version}-library.json.gz`,
        sha256: hash(library)
      }
    },
    files: { [`${version}-index.json.gz`]: index, [`${version}-library.json.gz`]: library }
  };
}
const first = snapshot("old"), second = snapshot("new");
let active = first;
let corrupt = false;
const client = createNagWebPersistentVaultClient({
  baseUrl: "https://vault.invalid",
  fetchImpl: async url => {
    const name = url.split("/").at(-1);
    if (name === "vault-manifest.json") {
      return new Response(JSON.stringify(active.manifest));
    }
    const bytes = first.files[name] || second.files[name];
    if (!bytes) return new Response("Not found", { status: 404 });
    return new Response(corrupt && name === "new-index.json.gz"
      ? new Uint8Array([1, 2, 3]) : bytes);
  }
});
const oldManifest = await client.loadManifest();
const oldIndex = await client.loadBrowseIndex();
const oldLibrary = await client.loadFullLibrary();
assert.equal((await client.getResource("smoke:old"))?.title, "old");

active = second;
corrupt = true;
await assert.rejects(client.refreshBrowseIndex(), /checksum mismatch/);
assert.strictEqual(client.manifest, oldManifest, "An unverified manifest must not enter the cache");
assert.strictEqual(client.browseIndex, oldIndex, "Keep the previously verified index on checksum failure");
assert.strictEqual(client.fullLibrary, oldLibrary, "Failed refresh must preserve cached resource details");
assert.equal((await client.search({ query: "old" })).total, 1);
assert.equal((await client.getResource("smoke:old"))?.title, "old");

corrupt = false;
const newIndex = await client.refreshBrowseIndex();
assert.strictEqual(client.browseIndex, newIndex);
assert.equal((await client.search({ query: "new" })).total, 1);
assert.equal(client.fullLibrary, null, "A changed checksum must invalidate old resource details");
assert.equal(client.resourceById, null);
assert.equal(await client.getResource("smoke:old"), null);
assert.equal((await client.getResource("smoke:new"))?.title, "new");
const newLibrary = client.fullLibrary;
await client.refreshBrowseIndex();
assert.strictEqual(client.fullLibrary, newLibrary, "Identical snapshots must retain the cached library");

active = { ...second, manifest: { format: "invalid", consolidated: second.manifest.consolidated } };
await assert.rejects(client.refreshBrowseIndex(), /Invalid NagWeb Vault manifest/);
assert.equal(client.browseIndex.resourceCount, 1);
assert.strictEqual(client.fullLibrary, newLibrary);
assert.equal((await client.getResource("smoke:new"))?.title, "new");
console.log("NagWeb Vault atomic refresh, checksum rejection, cache invalidation and recovery: OK");
