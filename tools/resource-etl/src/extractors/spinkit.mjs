import { fetchJson, fetchText } from "../lib/http.mjs";

const REPO = "tobiasahlin/SpinKit";
const REF = "master";

function rawUrl(commit, filePath) {
  const encoded = filePath.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${REPO}/${commit}/${encoded}`;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseSpinKitReadme(readme) {
  const items = [];
  const pattern = /^###\s+([^\n]+)\n\n```html\n([\s\S]*?)```/gm;

  for (const match of String(readme || "").matchAll(pattern)) {
    const title = match[1].trim();
    const html = match[2].trim();
    if (!title || !html) continue;

    items.push({
      name: slugify(title),
      title,
      html
    });
  }

  return items;
}

export async function extractSpinKit({ limit = 12, all = false } = {}) {
  const commitInfo = await fetchJson(
    `https://api.github.com/repos/${REPO}/commits/${REF}`
  );
  const commit = commitInfo.sha;

  const [readme, css, packageJson] = await Promise.all([
    fetchText(rawUrl(commit, "README.md")),
    fetchText(rawUrl(commit, "spinkit.css")),
    fetchJson(rawUrl(commit, "package.json"))
  ]);

  const parsed = parseSpinKitReadme(readme);
  const selected = all
    ? parsed
    : parsed.slice(0, Math.max(1, Number(limit) || 12));

  return {
    repository: `https://github.com/${REPO}`,
    commit,
    css,
    packageJson,
    totalAvailable: parsed.length,
    items: selected
  };
}
