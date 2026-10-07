import { fetchJson, fetchText } from "../lib/http.mjs";
import { mapLimit } from "../lib/async.mjs";

const REPO = "mrdoob/three.js";
const REF = "dev";

function rawUrl(commit, path) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${REPO}/${commit}/${encoded}`;
}

function runtimeOnlyHtml(html) {
  return String(html)
    .replace(/<meta\b[^>]*>/gi, "")
    .replace(/<link\b[^>]*>/gi, "")
    .replace(/<a\b[^>]*href=["'][^"']+["'][^>]*>/gi, "<a>")
    .replace(/<!--([\s\S]*?)-->/g, "");
}

export function analyzeThreeExample(html) {
  const runtime = runtimeOnlyHtml(html);
  const externalAssetPattern =
    /["'`](?:https?:\/\/|\.\.\/|\.\/)?[^"'`\s]+\.(?:png|jpe?g|webp|gif|avif|svg|hdr|exr|glb|gltf|fbx|obj|stl|dae|3ds|ply|pcd|vtk|mp4|webm|mov|mp3|ogg|wav|flac|ttf|otf|woff2?|bin)(?:[?#][^"'`]*)?["'`]/i;

  const relativeDataPattern =
    /(?:fetch|load|loadAsync)\s*\(\s*["'`](?!data:)(?!three(?:\/addons)?)[^"'`]+\.(?:json|csv|xml|txt)(?:[?#][^"'`]*)?["'`]/i;

  const mediaTagPattern =
    /<(?:img|video|audio|source)\b[^>]*\bsrc=["'](?!data:)[^"']+["']/i;

  const externalFetchPattern =
    /fetch\s*\(\s*["'`]https?:\/\//i;

  const reasons = [];
  if (externalAssetPattern.test(runtime)) reasons.push("external-binary-or-media");
  if (relativeDataPattern.test(runtime)) reasons.push("external-data");
  if (mediaTagPattern.test(runtime)) reasons.push("media-tag");
  if (externalFetchPattern.test(runtime)) reasons.push("external-fetch");

  const imports = [
    ...runtime.matchAll(/from\s+["']([^"']+)["']/g)
  ].map((match) => match[1]);

  return {
    codeOnly: reasons.length === 0,
    reasons,
    imports: [...new Set(imports)]
  };
}

export async function extractThreeCodeScenes({
  limit = 20,
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
    throw new Error("Three.js Git tree was truncated; refusing incomplete scan.");
  }

  const candidates = (tree.tree || [])
    .filter(
      (entry) =>
        entry.type === "blob" &&
        /^examples\/[^/]+\.html$/.test(entry.path) &&
        !/examples\/index\.html$/.test(entry.path)
    )
    .sort((a, b) => a.path.localeCompare(b.path));

  const scanned = await mapLimit(candidates, concurrency, async (entry) => {
    const html = await fetchText(rawUrl(commit, entry.path));
    return {
      path: entry.path,
      sha: entry.sha,
      html,
      analysis: analyzeThreeExample(html)
    };
  });

  let items = scanned.filter((item) => item.analysis.codeOnly);
  const totalCodeOnly = items.length;
  if (!all) items = items.slice(0, Math.max(1, Number(limit) || 20));

  return {
    repository: `https://github.com/${REPO}`,
    commit,
    totalScanned: scanned.length,
    totalCodeOnly,
    rejected: scanned.length - totalCodeOnly,
    items
  };
}
