// Browser-only, optional Cache Storage layer for verified Vault payloads.
// No service worker, downloads, background requests or third-party hosts.
const CACHE_NAME = "nagweb-resource-vault-verified-v1";
const CACHE_CAPACITY = 48;
function cacheKey(baseUrl, relativePath, hash) {
  return baseUrl + "/" + relativePath.split("/").map(encodeURIComponent).join("/") +
    "?nagweb_sha256=" + hash;
}
export class OfflineVaultCache {
  constructor(baseUrl, cacheStorage = globalThis.caches) {
    this.baseUrl = String(baseUrl).replace(/\/$/, "");
    this.storage = cacheStorage;
    this.manifestKey = this.baseUrl + "/vault-manifest.json?nagweb_verified_index=1";
  }
  async open() {
    if (!this.storage?.open) return null;
    try { return await this.storage.open(CACHE_NAME); }
    catch { return null; }
  }
  async readVerified(relativePath, hash) {
    if (!/^[a-f0-9]{64}$/i.test(hash || "")) return null;
    try {
      const cache = await this.open();
      const response = await cache?.match(cacheKey(this.baseUrl,relativePath,hash));
      return response ? new Uint8Array(await response.arrayBuffer()) : null;
    } catch { return null; }
  }
  async saveVerified(relativePath, hash, bytes) {
    if (!/^[a-f0-9]{64}$/i.test(hash || "")) return false;
    try {
      const cache = await this.open();
      if (!cache) return false;
      const key = cacheKey(this.baseUrl,relativePath,hash);
      await cache.put(key,new Response(bytes));
      await this.bound(cache);
      return true;
    } catch { return false; }
  }
  async readManifest() {
    try {
      const response = await (await this.open())?.match(this.manifestKey);
      if (!response) return null;
      const value = await response.json();
      return value?.format === "nagweb-resource-vault-index" &&
        value.consolidated?.browseIndexPath &&
        /^[a-f0-9]{64}$/i.test(value.consolidated.browseIndexSha256 || "") ? value : null;
    } catch { return null; }
  }
  async saveManifest(manifest) {
    // Only call after the matching browse index passes SHA and schema checks.
    if (manifest?.format !== "nagweb-resource-vault-index" ||
        !/^[a-f0-9]{64}$/i.test(manifest?.consolidated?.browseIndexSha256 || "")) return false;
    try {
      const cache = await this.open();
      if (!cache) return false;
      await cache.put(this.manifestKey,new Response(JSON.stringify(manifest),{
        headers:{"Content-Type":"application/json"}
      }));
      await this.bound(cache);
      return true;
    } catch { return false; }
  }
  async bound(cache) {
    // Keep a useful offline working set without accumulating endless versions.
    try {
      const keys=await cache.keys();
      const vaultKeys=keys.filter(req=>req.url.startsWith(this.baseUrl+"/") &&
        req.url !== this.manifestKey);
      for (let n=0;n<vaultKeys.length-CACHE_CAPACITY;n++) {
        await cache.delete(vaultKeys[n]);
      }
    } catch { /* Storage quotas and private mode must not break browsing. */ }
  }
}
