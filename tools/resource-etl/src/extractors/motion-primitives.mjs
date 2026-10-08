import { fetchJson } from "../lib/http.mjs";
import { mapLimit } from "../lib/async.mjs";

const REPO = "ibelick/motion-primitives";

function rawUrl(commit, path) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${REPO}/${commit}/${encoded}`;
}

export async function extractMotionPrimitives({
  limit = 25,
  all = false,
  concurrency = 6
} = {}) {
  const commitInfo = await fetchJson(
    `https://api.github.com/repos/${REPO}/commits/main`
  );
  const commit = commitInfo.sha;

  const tree = await fetchJson(
    `https://api.github.com/repos/${REPO}/git/trees/${commit}?recursive=1`
  );

  if (tree.truncated) {
    throw new Error(
      "Motion Primitives Git tree was truncated; refusing incomplete mirror."
    );
  }

  let files = (tree.tree || [])
    .filter(
      (entry) =>
        /^public\/c\/[^/]+\.json$/.test(entry.path) &&
        entry.path !== "public/c/registry.json"
    )
    .sort((a, b) => a.path.localeCompare(b.path));

  const totalAvailable = files.length;
  if (!all) files = files.slice(0, Math.max(1, Number(limit) || 25));

  const items = await mapLimit(files, concurrency, async (entry) => ({
    path: entry.path,
    sha: entry.sha,
    raw: await fetchJson(rawUrl(commit, entry.path))
  }));

  return {
    repository: `https://github.com/${REPO}`,
    commit,
    totalAvailable,
    items
  };
}
