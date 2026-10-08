import { fetchJson, fetchText } from "../lib/http.mjs";
import { mapLimit } from "../lib/async.mjs";

const REPO = "miniMAC/magic";
const REF = "master";

function rawUrl(commit, filePath) {
  const encoded = filePath.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${REPO}/${commit}/${encoded}`;
}

function effectInfo(filePath) {
  const match = filePath.match(
    /^assets\/scss\/([^/]+)\/_([^/]+)\.scss$/
  );
  if (!match) return null;

  return {
    category: match[1],
    name: match[2]
  };
}

export async function extractMagicCssEffects({
  limit = 25,
  all = false,
  concurrency = 8
} = {}) {
  const commitInfo = await fetchJson(
    `https://api.github.com/repos/${REPO}/commits/${REF}`
  );
  const commit = commitInfo.sha;

  const tree = await fetchJson(
    `https://api.github.com/repos/${REPO}/git/trees/${commit}?recursive=1`
  );

  if (tree.truncated) {
    throw new Error("Magic.css Git tree was truncated; refusing incomplete mirror.");
  }

  const effects = (tree.tree || [])
    .filter((entry) => {
      if (entry.type !== "blob") return false;
      return Boolean(effectInfo(entry.path));
    })
    .sort((a, b) => a.path.localeCompare(b.path));

  const selected = all
    ? effects
    : effects.slice(0, Math.max(1, Number(limit) || 25));

  const [baseCss, packageJson, items] = await Promise.all([
    fetchText(rawUrl(commit, "assets/scss/_magictime.scss")),
    fetchJson(rawUrl(commit, "package.json")),
    mapLimit(selected, concurrency, async (entry) => {
      const info = effectInfo(entry.path);
      const code = await fetchText(rawUrl(commit, entry.path));
      return {
        ...info,
        path: entry.path,
        sha: entry.sha,
        code
      };
    })
  ]);

  return {
    repository: `https://github.com/${REPO}`,
    commit,
    packageJson,
    baseCss,
    totalAvailable: effects.length,
    items
  };
}
