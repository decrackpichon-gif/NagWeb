import { fetchJson } from "../lib/http.mjs";

const REPO = "pmndrs/market-assets";
const BRANCH = "main";
const TREE_URL =
  `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`;

function rawUrl(path) {
  const encoded = path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${encoded}`;
}

function normalizeTypes(types) {
  const allowed = new Set(["models", "materials", "hdris"]);
  return [...new Set(types)].filter((type) => allowed.has(type));
}

function groupTree(tree, types) {
  const typeSet = new Set(types);
  const grouped = new Map();

  for (const entry of tree || []) {
    if (entry.type !== "blob") continue;

    const match = entry.path.match(
      /^files\/(models|materials|hdris)\/([^/]+)\/(.+)$/
    );
    if (!match) continue;

    const [, type, slug, relativePath] = match;
    if (!typeSet.has(type)) continue;

    const key = `${type}:${slug}`;
    if (!grouped.has(key)) {
      grouped.set(key, { type, slug, files: [] });
    }

    grouped.get(key).files.push({
      path: entry.path,
      relativePath,
      size: Number(entry.size || 0) || undefined,
      sha: entry.sha,
      url: rawUrl(entry.path)
    });
  }

  return [...grouped.values()].filter((asset) =>
    asset.files.some((file) => file.relativePath === "info.json")
  );
}

function interleaveByType(assets, types, limit) {
  const buckets = new Map(
    types.map((type) => [
      type,
      assets
        .filter((asset) => asset.type === type)
        .sort((a, b) => a.slug.localeCompare(b.slug))
    ])
  );

  const result = [];
  let index = 0;

  while (result.length < limit) {
    let added = false;

    for (const type of types) {
      const item = buckets.get(type)?.[index];
      if (!item) continue;
      result.push(item);
      added = true;
      if (result.length >= limit) break;
    }

    if (!added) break;
    index += 1;
  }

  return result;
}

export async function extractPmndrsAssets({
  limit = 10,
  types = ["models", "materials", "hdris"]
} = {}) {
  const safeTypes = normalizeTypes(types);
  const safeLimit = Math.max(1, Number(limit) || 10);

  if (!safeTypes.length) {
    throw new Error("PMNDRS requires at least one valid type.");
  }

  const treePayload = await fetchJson(TREE_URL);
  const assets = groupTree(treePayload.tree || [], safeTypes);
  const selected = interleaveByType(assets, safeTypes, safeLimit);
  const items = [];

  for (const asset of selected) {
    const infoFile = asset.files.find(
      (file) => file.relativePath === "info.json"
    );

    let info = {};
    try {
      info = await fetchJson(infoFile.url);
    } catch (error) {
      info = {
        name: asset.slug,
        license: null,
        _warning: `Could not read info.json: ${error.message}`
      };
    }

    items.push({
      ...asset,
      info
    });
  }

  return {
    repository: `https://github.com/${REPO}`,
    branch: BRANCH,
    treeSha: treePayload.sha,
    items
  };
}

export function selectPmndrsEntryFile(asset) {
  const files = asset.files || [];
  const nonMeta = files.filter(
    (file) =>
      file.relativePath !== "info.json" &&
      !/thumbnail\.(png|jpe?g|webp)$/i.test(file.relativePath)
  );

  const preferences =
    asset.type === "models"
      ? [/\.glb$/i, /\.gltf$/i, /\.fbx$/i, /\.obj$/i]
      : asset.type === "hdris"
        ? [/\.hdr$/i, /\.exr$/i]
        : [
            /(?:color|diffuse|albedo|matcap).+\.(png|jpe?g|webp)$/i,
            /\.(png|jpe?g|webp)$/i
          ];

  for (const pattern of preferences) {
    const match = nonMeta.find((file) => pattern.test(file.relativePath));
    if (match) return match;
  }

  return nonMeta[0] || null;
}
