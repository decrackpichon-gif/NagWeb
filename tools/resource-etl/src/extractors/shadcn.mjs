import { fetchJson, fetchText } from "../lib/http.mjs";

const REGISTRY_URL =
  "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry.json";
const RAW_BASE =
  "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/";

function registryDependencyName(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    return url.pathname.split("/").filter(Boolean).pop()?.replace(/\.json$/i, "") || raw;
  } catch {
    return raw.split("/").filter(Boolean).pop()?.replace(/\.json$/i, "") || raw;
  }
}

function expandRegistryDependencyClosure(primaryItems, availableItems) {
  const byName = new Map(
    availableItems.map((item) => [item.name, item])
  );
  const selected = new Map();
  const queue = [];

  for (const item of primaryItems) {
    if (!selected.has(item.name)) {
      selected.set(item.name, item);
      queue.push(item);
    }
  }

  while (queue.length) {
    const current = queue.shift();

    for (const rawDependency of current.registryDependencies || []) {
      const dependencyName = registryDependencyName(rawDependency);
      const dependency = byName.get(dependencyName);

      if (!dependency || selected.has(dependency.name)) continue;

      selected.set(dependency.name, dependency);
      queue.push(dependency);
    }
  }

  return [...selected.values()];
}

export async function extractShadcnComponents({
  limit = 10,
  includeCode = true,
  all = false
} = {}) {
  const registry = await fetchJson(REGISTRY_URL);

  const registryItems = registry.items || [];
  const available = registryItems
    .filter((item) => item.type === "registry:ui");
  const primary = all
    ? available
    : available.slice(0, Math.max(1, Number(limit) || 10));

  const selected = expandRegistryDependencyClosure(primary, registryItems);
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
    primaryCount: primary.length,
    dependencyCount: Math.max(0, selected.length - primary.length),
    items
  };
}
