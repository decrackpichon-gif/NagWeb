import { fetchText } from "../lib/http.mjs";

const BASE_URL = "https://kenney.nl";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeEntities(value = "") {
  return String(value)
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripHtml(html = "") {
  return decodeEntities(
    String(html)
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/p>|<\/div>|<\/td>|<\/th>|<\/li>|<\/h\d>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function valueAfterLabel(lines, label, stopLabels = []) {
  const index = lines.findIndex(
    (line) => line.toLowerCase() === label.toLowerCase()
  );
  if (index === -1) return [];

  const values = [];
  for (let i = index + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (
      stopLabels.some(
        (stop) => line.toLowerCase() === stop.toLowerCase()
      )
    ) {
      break;
    }
    values.push(line);
    if (values.length >= 4) break;
  }

  return values;
}

function absoluteKenneyUrl(value) {
  if (!value) return undefined;
  return new URL(value, BASE_URL).toString();
}

export function extractKenneySlugsFromCatalog(html) {
  const slugs = new Set();
  const regex = /href=["']\/assets\/([a-z0-9][a-z0-9-]*)(?:["'?#])/gi;
  let match;

  while ((match = regex.exec(html))) {
    const slug = match[1].toLowerCase();
    if (slug && !slug.startsWith("page-")) slugs.add(slug);
  }

  return [...slugs];
}

export function parseKenneyAssetPage(slug, html) {
  const lines = stripHtml(html);

  const titleMatch = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch
    ? stripHtml(titleMatch[1]).join(" ")
    : slug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

  const downloadMatch = html.match(
    /href=["']([^"']*\/media\/pages\/assets\/[^"']+\.zip(?:\?[^"']*)?)["']/i
  );

  const imageMatches = [
    ...html.matchAll(
      /<meta\b[^>]*(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["'][^>]*>/gi
    ),
    ...html.matchAll(
      /<meta\b[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>/gi
    )
  ];

  const tags = [
    ...new Set(
      [...html.matchAll(/href=["'][^"']*[?&]t=([^"'&#]+)[^"']*["']/gi)]
        .map((match) => decodeURIComponent(match[1].replaceAll("+", " ")))
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  ];

  const categoryValues = valueAfterLabel(lines, "Category", [
    "Features",
    "Tile size",
    "Files",
    "License",
    "Download",
    "Updates"
  ]);

  const filesValues = valueAfterLabel(lines, "Files", [
    "License",
    "Download",
    "Updates"
  ]);

  const fileCountMatch = filesValues.join(" ").match(/(\d+)\s*[×x]?/i);
  const isCc0 = lines.some((line) => /Creative Commons CC0/i.test(line));

  let category = categoryValues
    .join(" • ")
    .replace(/\s*•\s*/g, " • ")
    .trim();

  if (!category) {
    const categoryText = lines.find((line) =>
      /^(2D|3D|UI|Audio|Pixel|Textures)(?:\s*•|$)/i.test(line)
    );
    category = categoryText || "";
  }

  const categoryRoot =
    category.match(/\b3D\b/i)
      ? "3D"
      : category.match(/\bTextures?\b/i)
        ? "Textures"
        : category.match(/\bUI\b/i)
          ? "UI"
          : category.match(/\b2D\b/i)
            ? "2D"
            : category.match(/\bAudio\b/i)
              ? "Audio"
              : "Other";

  return {
    slug,
    title,
    sourceUrl: `${BASE_URL}/assets/${slug}`,
    downloadUrl: absoluteKenneyUrl(downloadMatch?.[1]),
    previewUrl: absoluteKenneyUrl(imageMatches[0]?.[1]),
    tags,
    category,
    categoryRoot,
    fileCount: fileCountMatch ? Number(fileCountMatch[1]) : undefined,
    license: isCc0 ? "CC0" : "unknown",
    verifiedCc0: isCc0,
    rawText: lines.slice(0, 160)
  };
}

export async function extractKenneyPacks({
  limit = 10,
  maxPages = 30
} = {}) {
  const safeLimit = Math.max(1, Number(limit) || 10);
  const slugs = [];
  const seen = new Set();

  for (let page = 1; page <= maxPages && slugs.length < safeLimit; page += 1) {
    const url =
      page === 1
        ? `${BASE_URL}/assets?sort=name`
        : `${BASE_URL}/assets/page:${page}?sort=name`;

    const html = await fetchText(url);
    const pageSlugs = extractKenneySlugsFromCatalog(html);
    let added = 0;

    for (const slug of pageSlugs) {
      if (seen.has(slug)) continue;
      seen.add(slug);
      slugs.push(slug);
      added += 1;
      if (slugs.length >= safeLimit) break;
    }

    if (added === 0) break;
    await delay(120);
  }

  const items = [];

  for (const slug of slugs.slice(0, safeLimit)) {
    const html = await fetchText(`${BASE_URL}/assets/${slug}`);
    items.push(parseKenneyAssetPage(slug, html));
    await delay(120);
  }

  return {
    sourceUrl: `${BASE_URL}/assets`,
    items
  };
}
