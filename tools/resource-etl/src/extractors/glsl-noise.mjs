import { fetchJson, fetchText } from "../lib/http.mjs";
import { mapLimit } from "../lib/async.mjs";

const REPO = "hughsk/glsl-noise";
const REF = "master";

function rawUrl(commit, path) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${REPO}/${commit}/${encoded}`;
}

function exportedSymbol(code) {
  const match = String(code).match(/#pragma\s+glslify:\s*export\(([^)]+)\)/);
  return match?.[1]?.trim() || null;
}

export async function extractGlslNoise({ concurrency = 6 } = {}) {
  const commitInfo = await fetchJson(
    `https://api.github.com/repos/${REPO}/commits/${REF}`
  );
  const commit = commitInfo.sha;

  const tree = await fetchJson(
    `https://api.github.com/repos/${REPO}/git/trees/${commit}?recursive=1`
  );

  if (tree.truncated) {
    throw new Error("glsl-noise Git tree was truncated; refusing incomplete mirror.");
  }

  const files = (tree.tree || [])
    .filter((entry) => entry.type === "blob" && /^(classic|periodic|simplex)\/\dd\.glsl$/.test(entry.path))
    .sort((a, b) => a.path.localeCompare(b.path));

  const items = await mapLimit(files, concurrency, async (entry) => {
    const code = await fetchText(rawUrl(commit, entry.path));
    return {
      path: entry.path,
      sha: entry.sha,
      code,
      exportedSymbol: exportedSymbol(code)
    };
  });

  return {
    repository: `https://github.com/${REPO}`,
    commit,
    items
  };
}
