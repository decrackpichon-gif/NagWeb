import { fetchJson } from "../lib/http.mjs";

const API_BASE = "https://api.polyhaven.com";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function extractPolyHavenModels({
  limit = 5,
  includeFiles = true
} = {}) {
  const catalog = await fetchJson(`${API_BASE}/assets?type=models`);

  const entries = Object.entries(catalog)
    .filter(([, meta]) => !meta.date_published || meta.date_published * 1000 <= Date.now())
    .sort(
      ([idA, a], [idB, b]) =>
        Number(b.download_count || 0) - Number(a.download_count || 0) ||
        idA.localeCompare(idB)
    )
    .slice(0, limit);

  const results = [];

  for (const [id, meta] of entries) {
    let files = null;

    if (includeFiles) {
      files = await fetchJson(`${API_BASE}/files/${encodeURIComponent(id)}`);
      await delay(120);
    }

    results.push({ id, meta, files });
  }

  return results;
}

function resolutionScore(value) {
  const match = String(value).toLowerCase().match(/^(\d+(?:\.\d+)?)k$/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function chooseResolution(available, preferred) {
  if (available.includes(preferred)) return preferred;
  const target = resolutionScore(preferred);
  return [...available].sort(
    (a, b) =>
      Math.abs(resolutionScore(a) - target) -
      Math.abs(resolutionScore(b) - target)
  )[0];
}

function fileRecordToEntry(record, relativePath, role = "model") {
  if (!record?.url) return null;
  return {
    role,
    path: relativePath,
    url: record.url,
    size: Number(record.size || 0) || undefined,
    md5: record.md5 || undefined
  };
}

export function resolvePolyHavenModelPackage(
  files,
  { format = "gltf", resolution = "1k" } = {}
) {
  const formatNode = files?.[format];

  if (formatNode && typeof formatNode === "object") {
    const resolutions = Object.keys(formatNode);
    const chosenResolution = chooseResolution(resolutions, resolution);
    const resolutionNode = formatNode?.[chosenResolution];

    if (resolutionNode && typeof resolutionNode === "object") {
      const mainRecord =
        resolutionNode[format] ||
        Object.values(resolutionNode).find((value) => value?.url);

      if (mainRecord?.url) {
        const mainName =
          new URL(mainRecord.url).pathname.split("/").pop() ||
          `asset.${format}`;

        const main = fileRecordToEntry(mainRecord, mainName);
        const includes = Object.entries(mainRecord.include || {})
          .map(([relativePath, record]) =>
            fileRecordToEntry(record, relativePath, "source")
          )
          .filter(Boolean);

        return {
          format,
          resolution: chosenResolution,
          main,
          includes
        };
      }
    }
  }

  const terminals = flattenPolyHavenFiles(files);
  const preferred = terminals.find((item) =>
    item.url.toLowerCase().includes(`.${format}`)
  );

  if (!preferred) return null;

  return {
    format,
    resolution: resolution || null,
    main: preferred,
    includes: []
  };
}

export function flattenPolyHavenFiles(tree) {
  const out = [];
  const seen = new Set();

  function visit(value, trail = []) {
    if (!value || typeof value !== "object") return;

    if (typeof value.url === "string" && !seen.has(value.url)) {
      seen.add(value.url);
      const pathname = new URL(value.url).pathname;
      const filename = pathname.split("/").pop() || "file";
      out.push({
        role: /\.(glb|gltf|fbx|obj|blend|usd|usdz)$/i.test(filename)
          ? "model"
          : "source",
        path: filename,
        sourcePath: trail.join("/"),
        url: value.url,
        size: Number(value.size || 0) || undefined,
        md5: value.md5 || undefined
      });
    }

    if (value.include && typeof value.include === "object") {
      for (const [relativePath, record] of Object.entries(value.include)) {
        if (record?.url && !seen.has(record.url)) {
          seen.add(record.url);
          out.push({
            role: "source",
            path: relativePath,
            sourcePath: [...trail, "include", relativePath].join("/"),
            url: record.url,
            size: Number(record.size || 0) || undefined,
            md5: record.md5 || undefined
          });
        }
      }
    }

    for (const [key, child] of Object.entries(value)) {
      if (key === "include") continue;
      if (child && typeof child === "object") {
        visit(child, [...trail, key]);
      }
    }
  }

  visit(tree);
  return out;
}
