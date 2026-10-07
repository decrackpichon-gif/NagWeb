import { fetchJson, fetchText } from "../lib/http.mjs";

const REGISTRY_URL =
  "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry.json";
const RAW_BASE =
  "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/";

export async function extractShadcnComponents({
  limit = 10,
  includeCode = true,
  all = false
} = {}) {
  const registry = await fetchJson(REGISTRY_URL);

  const available = (registry.items || [])
    .filter((item) => item.type === "registry:ui");
  const selected = all
    ? available
    : available.slice(0, Math.max(1, Number(limit) || 10));

  const items = [];

  for (const item of selected) {
    const files = [];

    for (const file of item.files || []) {
      const sourceUrl = new URL(file.path, RAW_BASE).toString();
      const content = includeCode ? await fetchText(sourceUrl) : undefined;

      files.push({
        ...file,
        sourceUrl,
        content
      });
    }

    items.push({ raw: item, files });
  }

  return {
    registry: {
      name: registry.name,
      homepage: registry.homepage,
      sourceUrl: REGISTRY_URL
    },
    totalAvailable: available.length,
    items
  };
}
