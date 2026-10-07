import { fetchJson } from "../lib/http.mjs";

const API_URL = "https://ambientcg.com/api/v2/full_json";

const DEFAULT_INCLUDE = [
  "statisticsData",
  "tagData",
  "displayData",
  "dimensionsData",
  "relationshipData",
  "downloadData",
  "previewData",
  "mapData",
  "usdData",
  "imageData"
].join(",");

export async function extractAmbientCgAssets({
  limit = 10,
  types = ["3DModel", "Material"],
  sort = "Popular"
} = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 250));
  const url = new URL(API_URL);
  url.searchParams.set("type", types.join(","));
  url.searchParams.set("sort", sort);
  url.searchParams.set("limit", String(safeLimit));
  url.searchParams.set("offset", "0");
  url.searchParams.set("include", DEFAULT_INCLUDE);

  const payload = await fetchJson(url.toString());

  return {
    apiUrl: url.toString(),
    numberOfResults: Number(payload.numberOfResults || 0),
    items: payload.foundAssets || payload.assets || []
  };
}

export function flattenAmbientCgDownloads(asset) {
  const categories =
    asset?.downloadFolders?.default?.downloadFiletypeCategories || {};

  const out = [];

  for (const [category, node] of Object.entries(categories)) {
    for (const download of node?.downloads || []) {
      const url = download.downloadLink || download.url;
      if (!url) continue;

      out.push({
        category,
        attribute: String(download.attribute || ""),
        fileName:
          download.fileName ||
          new URL(url).pathname.split("/").pop() ||
          `${asset.assetId || "ambientcg"}.zip`,
        url,
        size:
          Number(download.fileSize || download.size || 0) || undefined,
        checksum:
          download.sha256 ||
          download.md5 ||
          undefined
      });
    }
  }

  return out;
}

function scoreDownload(download, resolution, fileType) {
  const attribute = download.attribute.toUpperCase();
  const category = download.category.toUpperCase();
  const wantedResolution = resolution.toUpperCase();
  const wantedType = fileType.toUpperCase();

  let score = 0;
  if (attribute === `${wantedResolution}-${wantedType}`) score += 100;
  if (attribute.includes(wantedResolution)) score += 35;
  if (attribute.includes(wantedType)) score += 25;
  if (category.includes("ZIP") || download.fileName.toLowerCase().endsWith(".zip")) score += 10;
  if (attribute.includes("JPG")) score += 3;

  return score;
}

export function selectAmbientCgDownload(
  asset,
  { resolution = "1K", fileType = "JPG" } = {}
) {
  const downloads = flattenAmbientCgDownloads(asset);
  if (!downloads.length) return null;

  return [...downloads].sort(
    (a, b) =>
      scoreDownload(b, resolution, fileType) -
        scoreDownload(a, resolution, fileType) ||
      (a.size || Number.MAX_SAFE_INTEGER) -
        (b.size || Number.MAX_SAFE_INTEGER)
  )[0];
}
