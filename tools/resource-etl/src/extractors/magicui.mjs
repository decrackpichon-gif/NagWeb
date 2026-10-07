import { fetchJson, fetchText } from "../lib/http.mjs";
import { mapLimit } from "../lib/async.mjs";

const REPO = "magicuidesign/magicui";

function rawUrl(commit, path) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${REPO}/${commit}/${encoded}`;
}

function repoPath(registryPath) {
  return registryPath.startsWith("apps/")
    ? registryPath
    : `apps/www/${registryPath}`;
}

export async function extractMagicUiComponents({
  limit = 25,
  all = false,
  concurrency = 6
} = {}) {
  const commitInfo = await fetchJson(`https://api.github.com/repos/${REPO}/commits/main`);
  const commit = commitInfo.sha;
  const registry = await fetchJson(rawUrl(commit, "registry.json"));

  let items = (registry.items || []).filter(
    (item) => item.type === "registry:ui" && (item.files || []).length
  );

  const totalAvailable = items.length;
  if (!all) items = items.slice(0, Math.max(1, Number(limit) || 25));

  const hydrated = await mapLimit(items, concurrency, async (item) => {
    const files = await mapLimit(item.files || [], 4, async (file) => {
      const sourcePath = repoPath(file.path);
      return {
        ...file,
        sourcePath,
        sourceUrl: rawUrl(commit, sourcePath),
        content: await fetchText(rawUrl(commit, sourcePath))
      };
    });
    return { raw: item, files };
  });

  return {
    registry: {
      name: registry.name,
      homepage: registry.homepage,
      repository: `https://github.com/${REPO}`,
      commit
    },
    totalAvailable,
    items: hydrated
  };
}
