import { fetchJson, fetchText } from "../lib/http.mjs";
import { mapLimit } from "../lib/async.mjs";

const REPO = "tailwindlabs/heroicons";
const BASE = "https://github.com/" + REPO;
const FOLDER = "optimized/24/outline";

// Diverse, usable defaults instead of 25 alphabetically adjacent arrow icons.
export const HEROICONS_FEATURED = [
  "academic-cap", "adjustments-horizontal", "arrow-down-tray", "bars-3",
  "bell", "bolt", "bookmark", "calendar", "camera", "chart-bar",
  "check-circle", "cloud", "code-bracket", "cog-6-tooth", "envelope",
  "eye", "film", "globe-alt", "heart", "home", "light-bulb",
  "magnifying-glass", "musical-note", "paint-brush", "photo",
  "play", "presentation-chart-line", "rocket-launch", "shopping-cart",
  "sparkles", "user-circle", "video-camera", "wrench-screwdriver"
];

export function selectHeroicons(entries, { limit = 25, all = false } = {}) {
  if (!Array.isArray(entries)) throw new Error("Heroicons index is invalid.");
  const byName = new Map();
  for (const entry of entries) {
    const name = entry?.name?.match(/^([a-z0-9]+(?:-[a-z0-9]+)*)\.svg$/)?.[1];
    if (!name || entry.type !== "file" || entry.path !== FOLDER + "/" + name + ".svg" ||
        !/^[a-f0-9]{40}$/.test(entry.sha || "")) continue;
    if (byName.has(name)) throw new Error("Duplicate Heroicons name: " + name);
    byName.set(name, { name, path: entry.path, sha: entry.sha });
  }
  if (!byName.size) throw new Error("No supported Heroicons outline SVGs found.");
  const selected = all
    ? [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))
    : [...HEROICONS_FEATURED.filter(name => byName.has(name)).map(name => byName.get(name)),
        ...[...byName.values()].filter(e => !HEROICONS_FEATURED.includes(e.name))
          .sort((a, b) => a.name.localeCompare(b.name))]
      .slice(0, Math.max(1, Number(limit) || 25));
  return { selected, available: byName.size };
}

function attributes(raw, allowed) {
  const found = new Map();
  const remainder = String(raw).replace(/\s+([a-zA-Z][a-zA-Z0-9:-]*)="([^"]*)"/g,
    (full, key, value) => {
      if (!allowed.includes(key) || found.has(key)) throw new Error("Unsupported SVG attribute: " + key);
      found.set(key, value);
      return "";
    });
  if (remainder.trim()) throw new Error("Unsupported SVG attribute syntax.");
  return found;
}

// Fail closed. Convert only the upstream, single-color outline geometry
// accepted by NagWeb's existing native SVG model. Never pass scripts, URLs,
// event handlers, defs, filters, images, inline styles, or nested SVG through.
export function normalizeHeroiconOutline(source) {
  if (typeof source !== "string" || source.length > 100000) throw new Error("Heroicons SVG size invalid.");
  const parsed = /^<svg\b([^>]*)>([\s\S]*?)<\/svg>$/.exec(source.trim());
  if (!parsed) throw new Error("Not a standalone Heroicons SVG.");
  const a = attributes(parsed[1], ["xmlns", "fill", "viewBox", "stroke", "stroke-width",
    "aria-hidden", "data-slot"]);
  if (a.get("xmlns") !== "http://www.w3.org/2000/svg" ||
      a.get("viewBox") !== "0 0 24 24" || a.get("fill") !== "none" ||
      a.get("stroke") !== "currentColor" || a.get("stroke-width") !== "1.5") {
    throw new Error("Unsupported Heroicons icon style or geometry.");
  }
  const paths = [];
  const leftovers = parsed[2].replace(/<path\b([^<>]*?)\/>/g, (whole, raw) => {
    const p = attributes(raw, ["d", "stroke-linecap", "stroke-linejoin"]);
    const d = p.get("d");
    if (!d || d.length > 20000 ||
        !/^[MmLlHhVvCcSsQqTtAaZz\d\s,.+eE-]+$/.test(d) ||
        p.get("stroke-linecap") !== "round" ||
        p.get("stroke-linejoin") !== "round") {
      throw new Error("Heroicons geometry is not a uniform outline.");
    }
    paths.push('<path d="' + d + '"/>');
    return "";
  });
  if (leftovers.trim() || !paths.length || paths.length > 30) {
    throw new Error("Heroicons SVG contains unsupported elements.");
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
    'width="24" height="24" fill="none" stroke="#000000" ' +
    'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    paths.join("") + "</svg>";
}

export async function extractHeroicons({ limit = 25, all = false, concurrency = 8 } = {}) {
  const release = await fetchJson("https://api.github.com/repos/" + REPO + "/commits/master");
  const commit = release.sha;
  if (!/^[a-f0-9]{40}$/.test(commit || "")) throw new Error("Heroicons Git commit invalid.");
  const folder = await fetchJson("https://api.github.com/repos/" + REPO +
    "/contents/" + FOLDER + "?ref=" + commit);
  const { selected, available } = selectHeroicons(folder, { limit, all });
  const licenseText = await fetchText("https://raw.githubusercontent.com/" + REPO +
    "/" + commit + "/LICENSE");
  if (!/^MIT License\s+Copyright \(c\) Tailwind Labs, Inc\./.test(licenseText)) {
    throw new Error("Heroicons license changed; review before mirroring.");
  }
  const items = await mapLimit(selected, Math.max(1, Math.min(12, Number(concurrency) || 8)), async entry => {
    const sourceSvg = await fetchText("https://raw.githubusercontent.com/" + REPO +
      "/" + commit + "/" + entry.path);
    try {
      const svg = normalizeHeroiconOutline(sourceSvg);
      return { ...entry, sourceSvg, svg };
    } catch (error) {
      // Some upstream SVGs may use markup outside NagWeb's native stroke
      // model. Do not import them, or abort the safe majority of the catalog.
      return { ...entry, excluded: String(error?.message || error) };
    }
  });
  const skipped = items.filter(item => item.excluded)
    .map(({ name, excluded }) => ({ name, reason: excluded }));
  return {
    repository: BASE, commit, licenseText, totalAvailable: available,
    items: items.filter(item => !item.excluded), skipped
  };
}
