import { fetchJson, fetchText } from "../lib/http.mjs";
import { mapLimit } from "../lib/async.mjs";

const REPO = "uiverse-io/galaxy";
const CATEGORY_ORDER = [
  "Buttons",
  "Cards",
  "Checkboxes",
  "Forms",
  "Inputs",
  "Notifications",
  "Patterns",
  "Radio-buttons",
  "Toggle-switches",
  "Tooltips",
  "loaders"
];

function rawUrl(commit, path) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${REPO}/${commit}/${encoded}`;
}

function parseFilename(path) {
  const filename = path.split("/").pop()?.replace(/\.html$/i, "") || "component";
  const split = filename.indexOf("_");
  return {
    filename,
    authorFromFilename: split > 0 ? filename.slice(0, split) : undefined,
    slug: split > 0 ? filename.slice(split + 1) : filename
  };
}

export function parseUiverseMetadata(path, html) {
  const source = String(html || "");
  const comment = source.match(
    /\/\*\s*From\s+Uiverse\.io\s+by\s+([^*\n-]+?)(?:\s+-\s+Tags:\s*([^*\n]+))?\s*\*\//i
  );
  const parsed = parseFilename(path);
  const category = path.split("/")[0] || "Other";
  const tags = comment?.[2]
    ? comment[2].split(",").map((tag) => tag.trim()).filter(Boolean)
    : [];

  return {
    category,
    author: comment?.[1]?.trim() || parsed.authorFromFilename || "unknown",
    slug: parsed.slug,
    filename: parsed.filename,
    tags
  };
}

export function isAutonomousUiverseHtml(html) {
  const source = String(html || "");
  if (/<script\b/i.test(source)) return false;
  if (/<iframe\b/i.test(source)) return false;
  if (/\b(?:src|href)\s*=\s*["']https?:\/\//i.test(source)) return false;
  if (/url\(\s*["']?https?:\/\//i.test(source)) return false;
  return true;
}

function interleaveByCategory(entries) {
  const buckets = new Map();

  for (const category of CATEGORY_ORDER) buckets.set(category, []);
  for (const entry of entries) {
    const category = entry.path.split("/")[0];
    if (!buckets.has(category)) buckets.set(category, []);
    buckets.get(category).push(entry);
  }

  for (const list of buckets.values()) {
    list.sort((a, b) => a.path.localeCompare(b.path));
  }

  const output = [];
  let remaining = true;
  let index = 0;

  while (remaining) {
    remaining = false;
    for (const category of [...CATEGORY_ORDER, ...[...buckets.keys()].filter((x) => !CATEGORY_ORDER.includes(x))]) {
      const item = buckets.get(category)?.[index];
      if (!item) continue;
      output.push(item);
      remaining = true;
    }
    index += 1;
  }

  return output;
}

export async function extractUiverseComponents({
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
    throw new Error("Uiverse Galaxy Git tree was truncated; refusing incomplete mirror.");
  }

  const htmlEntries = interleaveByCategory(
    (tree.tree || []).filter(
      (entry) =>
        entry.type === "blob" &&
        /^[^/]+\/[^/]+\.html$/i.test(entry.path) &&
        CATEGORY_ORDER.includes(entry.path.split("/")[0])
    )
  );

  const targetCount = all
    ? htmlEntries.length
    : Math.max(1, Number(limit) || 25);

  const selected = [];
  const skipped = [];
  let cursor = 0;

  while (selected.length < targetCount && cursor < htmlEntries.length) {
    const batch = htmlEntries.slice(cursor, cursor + Math.max(concurrency * 2, 16));
    cursor += batch.length;

    const hydrated = await mapLimit(batch, concurrency, async (entry) => {
      const content = await fetchText(rawUrl(commit, entry.path));
      return {
        entry,
        content,
        metadata: parseUiverseMetadata(entry.path, content),
        autonomous: isAutonomousUiverseHtml(content)
      };
    });

    for (const item of hydrated) {
      if (!item.autonomous) {
        skipped.push({ path: item.entry.path, reason: "external-or-script-dependency" });
        continue;
      }
      selected.push(item);
      if (selected.length >= targetCount) break;
    }
  }

  return {
    repository: `https://github.com/${REPO}`,
    commit,
    totalAvailable: htmlEntries.length,
    scanned: cursor,
    items: selected,
    skipped
  };
}
