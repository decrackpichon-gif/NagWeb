import { fetchJson, fetchText } from "../lib/http.mjs";
import { mapLimit } from "../lib/async.mjs";

const REPO = "markmead/hyperui";

function rawUrl(commit, path) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${REPO}/${commit}/${encoded}`;
}

export function extractBodyHtml(html) {
  const match = String(html).match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return (match?.[1] || html).trim();
}

export function analyzeHyperUiHtml(html) {
  const body = extractBodyHtml(html);

  const reasons = [];
  if (/<(?:img|video|audio|source)\b[^>]*\bsrc=["'](?!data:)(?!#)[^"']+["']/i.test(body)) {
    reasons.push("external-media");
  }
  if (/url\(\s*["']?(?!data:)[^)"']+\.(?:png|jpe?g|webp|gif|avif|svg|mp4|webm|woff2?)/i.test(body)) {
    reasons.push("css-external-asset");
  }
  if (/<script\b[^>]*\bsrc=["'](?!\/component\.js)[^"']+["']/i.test(body)) {
    reasons.push("external-script");
  }

  return {
    codeOnly: reasons.length === 0,
    reasons,
    body
  };
}

function pairExamples(tree) {
  const byBase = new Map();

  for (const entry of tree || []) {
    const match = entry.path.match(
      /^public\/examples\/([^/]+)\/([^/]+)\/(\d+)(-dark)?\.html$/
    );
    if (!match || entry.type !== "blob") continue;

    const [, collection, group, index, dark] = match;
    const key = `${collection}/${group}/${index}`;

    if (!byBase.has(key)) {
      byBase.set(key, {
        key,
        collection,
        group,
        index: Number(index),
        light: null,
        dark: null
      });
    }

    byBase.get(key)[dark ? "dark" : "light"] = entry;
  }

  return [...byBase.values()]
    .filter((item) => item.light)
    .sort((a, b) =>
      a.collection.localeCompare(b.collection) ||
      a.group.localeCompare(b.group) ||
      a.index - b.index
    );
}

export async function extractHyperUiBlocks({
  limit = 25,
  all = false,
  concurrency = 8
} = {}) {
  const commitInfo = await fetchJson(
    `https://api.github.com/repos/${REPO}/commits/main`
  );
  const commit = commitInfo.sha;

  const tree = await fetchJson(
    `https://api.github.com/repos/${REPO}/git/trees/${commit}?recursive=1`
  );

  if (tree.truncated) {
    throw new Error("HyperUI Git tree was truncated; refusing incomplete scan.");
  }

  const pairs = pairExamples(tree.tree || []);
  const target = all ? Number.POSITIVE_INFINITY : Math.max(1, Number(limit) || 25);
  const accepted = [];
  let scanned = 0;
  const batchSize = all ? Math.max(20, concurrency * 4) : Math.max(16, target * 3);

  for (let start = 0; start < pairs.length && accepted.length < target; start += batchSize) {
    const batch = pairs.slice(start, start + batchSize);

    const hydrated = await mapLimit(batch, concurrency, async (pair) => {
      const [lightHtml, darkHtml] = await Promise.all([
        fetchText(rawUrl(commit, pair.light.path)),
        pair.dark ? fetchText(rawUrl(commit, pair.dark.path)) : Promise.resolve(null)
      ]);

      return {
        ...pair,
        lightHtml,
        darkHtml,
        lightAnalysis: analyzeHyperUiHtml(lightHtml),
        darkAnalysis: darkHtml ? analyzeHyperUiHtml(darkHtml) : null
      };
    });

    scanned += hydrated.length;

    for (const item of hydrated) {
      const safeLight = item.lightAnalysis.codeOnly;
      const safeDark = !item.darkAnalysis || item.darkAnalysis.codeOnly;
      if (!safeLight || !safeDark) continue;
      accepted.push(item);
      if (accepted.length >= target) break;
    }
  }

  const [componentCss, componentJs] = await Promise.all([
    fetchText(rawUrl(commit, "public/component.css")),
    fetchText(rawUrl(commit, "public/component.js"))
  ]);

  return {
    repository: `https://github.com/${REPO}`,
    commit,
    totalPairs: pairs.length,
    scanned,
    completeScan: scanned >= pairs.length,
    componentCss,
    componentJs,
    items: accepted
  };
}
