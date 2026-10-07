import { fetchJson, fetchText } from "../lib/http.mjs";
import { mapLimit } from "../lib/async.mjs";

const REPO = "lucide-icons/lucide";

function rawUrl(commit, path) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${REPO}/${commit}/${encoded}`;
}

export async function extractLucideIcons({
  limit = 50,
  all = false,
  concurrency = 8
} = {}) {
  const commitInfo = await fetchJson(`https://api.github.com/repos/${REPO}/commits/main`);
  const commit = commitInfo.sha;
  const tree = await fetchJson(
    `https://api.github.com/repos/${REPO}/git/trees/${commit}?recursive=1`
  );

  if (tree.truncated) {
    throw new Error("Lucide Git tree was truncated; refusing incomplete mirror.");
  }

  const groups = new Map();
  for (const entry of tree.tree || []) {
    const match = entry.path.match(/^icons\/([^/]+)\.(json|svg)$/);
    if (!match) continue;
    const [, name, ext] = match;
    if (!groups.has(name)) groups.set(name, {});
    groups.get(name)[ext] = entry;
  }

  let names = [...groups.keys()]
    .filter((name) => groups.get(name).json && groups.get(name).svg)
    .sort((a, b) => a.localeCompare(b));

  if (!all) names = names.slice(0, Math.max(1, Number(limit) || 50));

  const items = await mapLimit(names, concurrency, async (name) => {
    const pair = groups.get(name);
    const [meta, svg] = await Promise.all([
      fetchJson(rawUrl(commit, pair.json.path)),
      fetchText(rawUrl(commit, pair.svg.path))
    ]);

    return {
      name,
      meta,
      svg,
      svgSha: pair.svg.sha,
      metaSha: pair.json.sha
    };
  });

  return {
    repository: `https://github.com/${REPO}`,
    commit,
    totalAvailable: groups.size,
    items
  };
}
