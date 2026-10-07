import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { getSourcePolicy } from "./source-policies.mjs";

function withoutArtifactContent(resource) {
  return {
    ...resource,
    artifacts: (resource.artifacts || []).map(({ content, ...artifact }) => artifact)
  };
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

export async function writeResourceToVault(rootDir, resource) {
  const provider = resource.source.provider;
  const resourceDir = path.join(rootDir, "providers", provider, resource.slug);
  const filesDir = path.join(resourceDir, "files");
  await mkdir(filesDir, { recursive: true });

  for (const artifact of resource.artifacts || []) {
    if (typeof artifact.content !== "string") continue;

    const target = artifact.targetPath || `${artifact.id}.${artifact.format || "txt"}`;
    const safeTarget = target
      .replaceAll("\\", "/")
      .split("/")
      .filter((part) => part && part !== "." && part !== "..")
      .join("/");

    const artifactPath = path.join(filesDir, safeTarget);
    await mkdir(path.dirname(artifactPath), { recursive: true });
    await writeFile(artifactPath, artifact.content, "utf8");
  }

  const manifestPath = path.join(resourceDir, "resource.json");
  await writeFile(manifestPath, JSON.stringify(resource, null, 2) + "\n", "utf8");

  return {
    ...withoutArtifactContent(resource),
    vaultPath: path.relative(rootDir, manifestPath).replaceAll("\\", "/")
  };
}

export async function mergeVaultCatalog(rootDir, entries) {
  await mkdir(rootDir, { recursive: true });
  const catalogPath = path.join(rootDir, "catalog.json");
  const existing = await readJson(catalogPath, {
    schemaVersion: "1.0",
    resources: []
  });

  const byId = new Map((existing.resources || []).map((resource) => [resource.id, resource]));
  for (const entry of entries) byId.set(entry.id, entry);

  const resources = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  const catalog = {
    schemaVersion: "1.0",
    updatedAt: new Date().toISOString(),
    count: resources.length,
    providers: [...new Set(resources.map((r) => r.source.provider))].sort(),
    resources
  };

  await writeFile(catalogPath, JSON.stringify(catalog, null, 2) + "\n", "utf8");
  return catalog;
}

export async function writePortableBundle(rootDir, catalog) {
  const resources = [];
  for (const item of catalog.resources || []) {
    if (!item.vaultPath) continue;
    const resource = await readJson(path.join(rootDir, item.vaultPath), null);
    if (resource) resources.push(resource);
  }

  const bundle = {
    format: "nagweb-code-library",
    version: "1.0",
    generatedAt: new Date().toISOString(),
    count: resources.length,
    resources
  };

  const filePath = path.join(rootDir, "nagweb-code-library.json");
  await writeFile(filePath, JSON.stringify(bundle) + "\n", "utf8");
  return filePath;
}

export async function writeThirdPartyNotices(rootDir, catalog) {
  const providers = [...new Set(
    (catalog.resources || []).map((resource) => resource.source.provider)
  )].sort();

  const sections = [
    "NagWeb Code Library · Third Party Notices",
    "==========================================",
    ""
  ];

  for (const provider of providers) {
    const policy = getSourcePolicy(provider);
    sections.push(provider);
    sections.push("-".repeat(provider.length));
    sections.push(`License: ${policy.licenseName || policy.licenseId || "Unknown"}`);
    if (policy.licenseUrl) sections.push(`License URL: ${policy.licenseUrl}`);
    sections.push(`Mirror mode: ${policy.mirrorMode}`);
    sections.push(policy.notes || "");
    sections.push("");
  }

  const filePath = path.join(rootDir, "THIRD_PARTY_NOTICES.txt");
  await writeFile(filePath, sections.join("\n"), "utf8");
  return filePath;
}
