const DEFAULT_BASE_URL =
  "https://raw.githubusercontent.com/decrackpichon-gif/NagWeb/resource-vault-data";

function cleanBaseUrl(value) {
  return String(value || DEFAULT_BASE_URL).replace(/\/$/, "");
}

function encodePath(relativePath) {
  return String(relativePath)
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(bytes) {
  if (globalThis.crypto?.subtle) {
    return toHex(await globalThis.crypto.subtle.digest("SHA-256", bytes));
  }

  if (typeof process !== "undefined" && process.versions?.node) {
    const { createHash } = await import("node:crypto");
    return createHash("sha256").update(Buffer.from(bytes)).digest("hex");
  }

  throw new Error("SHA-256 is not available in this runtime.");
}

async function gunzipText(bytes) {
  if (typeof DecompressionStream === "function") {
    const stream = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  if (typeof process !== "undefined" && process.versions?.node) {
    const { gunzipSync } = await import("node:zlib");
    return gunzipSync(Buffer.from(bytes)).toString("utf8");
  }

  throw new Error(
    "Gzip decompression is not available in this runtime. Modern browsers or Node.js 20+ are required."
  );
}

function asSet(value) {
  if (value === undefined || value === null || value === "") return null;
  const values = Array.isArray(value) ? value : [value];
  return new Set(values.map((item) => String(item).toLowerCase()));
}

function intersects(values, wanted) {
  if (!wanted) return true;
  return (values || []).some((value) => wanted.has(String(value).toLowerCase()));
}

export class NagWebPersistentVaultClient {
  constructor({
    baseUrl = DEFAULT_BASE_URL,
    fetchImpl = globalThis.fetch
  } = {}) {
    if (typeof fetchImpl !== "function") {
      throw new Error("A fetch implementation is required.");
    }

    this.baseUrl = cleanBaseUrl(baseUrl);
    // Native browser fetch cannot receive this client as its `this` value.
    this.fetchImpl = (...args) => fetchImpl(...args);
    this.manifest = null;
    this.browseIndex = null;
    this.fullLibrary = null;
    this.resourceById = null;
  }

  async fetchBytes(relativePath) {
    const response = await this.fetchImpl(
      `${this.baseUrl}/${encodePath(relativePath)}`,
      {
        headers: {
          Accept: "application/octet-stream,application/json;q=0.9,*/*;q=0.8"
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `NagWeb Vault request failed ${response.status}: ${relativePath}`
      );
    }

    return new Uint8Array(await response.arrayBuffer());
  }

  async fetchJson(relativePath) {
    const bytes = await this.fetchBytes(relativePath);
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  async loadManifest({ force = false } = {}) {
    if (!force && this.manifest) return this.manifest;

    const manifest = await this.fetchJson("vault-manifest.json");
    if (manifest.format !== "nagweb-resource-vault-index") {
      throw new Error("Unexpected NagWeb Vault manifest format.");
    }
    if (!manifest.consolidated?.browseIndexPath) {
      throw new Error("NagWeb Vault manifest has no consolidated browse index.");
    }

    this.manifest = manifest;
    return manifest;
  }

  async loadVerifiedGzipJson(relativePath, expectedSha256) {
    const bytes = await this.fetchBytes(relativePath);

    if (expectedSha256) {
      const actual = await sha256Hex(bytes);
      if (actual !== expectedSha256) {
        throw new Error(
          `NagWeb Vault checksum mismatch for ${relativePath}: expected ${expectedSha256}, got ${actual}`
        );
      }
    }

    return JSON.parse(await gunzipText(bytes));
  }

  async loadBrowseIndex({ force = false } = {}) {
    if (!force && this.browseIndex) return this.browseIndex;

    const manifest = await this.loadManifest();
    const consolidated = manifest.consolidated;
    const index = await this.loadVerifiedGzipJson(
      consolidated.browseIndexPath,
      consolidated.browseIndexSha256
    );

    if (
      index.format !== "nagweb-resource-browse-index" ||
      index.resourceCount !== consolidated.count
    ) {
      throw new Error("NagWeb Vault browse index does not match its manifest.");
    }

    this.browseIndex = index;
    return index;
  }

  async loadFullLibrary({ force = false } = {}) {
    if (!force && this.fullLibrary) return this.fullLibrary;

    const manifest = await this.loadManifest();
    const consolidated = manifest.consolidated;
    const library = await this.loadVerifiedGzipJson(
      consolidated.libraryPath,
      consolidated.sha256
    );

    if (
      library.format !== "nagweb-resource-vault-bundle" ||
      library.resourceCount !== consolidated.count
    ) {
      throw new Error("NagWeb Vault library does not match its manifest.");
    }

    this.fullLibrary = library;
    this.resourceById = new Map(
      (library.resources || [])
        .filter((resource) => resource?.id)
        .map((resource) => [resource.id, resource])
    );
    return library;
  }

  async getResource(id) {
    if (!id) return null;
    if (!this.resourceById) await this.loadFullLibrary();
    return this.resourceById.get(String(id)) || null;
  }

  async search({
    query = "",
    providers,
    families,
    kinds,
    categories,
    tags,
    capabilities,
    offset = 0,
    limit = 50
  } = {}) {
    const index = await this.loadBrowseIndex();
    const q = normalizeText(query);
    const providerSet = asSet(providers);
    const familySet = asSet(families);
    const kindSet = asSet(kinds);
    const categorySet = asSet(categories);
    const tagSet = asSet(tags);
    const capabilitySet = asSet(capabilities);
    const start = Math.max(0, Number(offset) || 0);
    const pageSize = Math.min(500, Math.max(1, Number(limit) || 50));

    const matched = [];

    for (const resource of index.resources || []) {
      if (
        providerSet &&
        !providerSet.has(String(resource.provider || "").toLowerCase())
      ) {
        continue;
      }
      if (
        familySet &&
        !familySet.has(String(resource.family || "").toLowerCase())
      ) {
        continue;
      }
      if (
        kindSet &&
        !kindSet.has(String(resource.kind || "").toLowerCase())
      ) {
        continue;
      }
      if (!intersects(resource.categories, categorySet)) continue;
      if (!intersects(resource.tags, tagSet)) continue;
      if (!intersects(resource.capabilities, capabilitySet)) continue;

      if (q) {
        const haystack = normalizeText([
          resource.id,
          resource.title,
          resource.name,
          resource.description,
          resource.provider,
          resource.family,
          resource.kind,
          ...(resource.categories || []),
          ...(resource.tags || []),
          resource.searchText
        ].filter(Boolean).join(" "));
        if (!haystack.includes(q)) continue;
      }

      matched.push(resource);
    }

    return {
      query,
      total: matched.length,
      offset: start,
      limit: pageSize,
      hasMore: start + pageSize < matched.length,
      items: matched.slice(start, start + pageSize)
    };
  }

  async facets() {
    const index = await this.loadBrowseIndex();
    const providers = new Map();
    const families = new Map();
    const kinds = new Map();

    const count = (map, key) => {
      const value = String(key || "unknown");
      map.set(value, (map.get(value) || 0) + 1);
    };

    for (const resource of index.resources || []) {
      count(providers, resource.provider);
      count(families, resource.family);
      count(kinds, resource.kind);
    }

    const sort = (map) =>
      [...map.entries()]
        .map(([value, countValue]) => ({ value, count: countValue }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

    return {
      resources: index.resourceCount,
      providers: sort(providers),
      families: sort(families),
      kinds: sort(kinds)
    };
  }

  clearMemoryCache() {
    this.manifest = null;
    this.browseIndex = null;
    this.fullLibrary = null;
    this.resourceById = null;
  }
}

export function createNagWebPersistentVaultClient(options) {
  return new NagWebPersistentVaultClient(options);
}

export { DEFAULT_BASE_URL };
