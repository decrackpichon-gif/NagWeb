// Compact, code-free icon previews for the searchable browse index.
// Heroicons are normalized during ingestion. Never copy arbitrary SVG
// elements or markup into a grid tile or the lightweight index.
export function browseHeroiconPaths(resource) {
  if (resource?.source?.provider !== "heroicons" ||
      resource.runtime?.renderer !== "nagweb-svg") return null;
  const svg = resource.artifacts?.find(a => a.role === "icon-data")?.content;
  if (typeof svg !== "string" || svg.length > 100000 ||
      !/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"[^<>]*>[\s\S]*<\/svg>$/.test(svg)) {
    return null;
  }
  const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  const paths = [...inner.matchAll(/<path d="([^"]+)"\/>/g)].map(m => m[1]);
  if (!paths.length || paths.length > 30 ||
      inner.replace(/<path d="[^"]+"\/>/g, "").trim() ||
      paths.some(d => d.length > 20000 ||
        !/^[MmLlHhVvCcSsQqTtAaZz\d\s,.+eE-]+$/.test(d))) {
    return null;
  }
  return paths;
}
