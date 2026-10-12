import { createHash } from "node:crypto";
import { getSourcePolicy } from "./vault/source-policies.mjs";

const sha256 = value => createHash("sha256").update(value).digest("hex");
const title = slug => slug.split("-").map(s => s[0].toUpperCase() + s.slice(1)).join(" ");

export function transformHeroiconOutline({ item, commit, licenseText }) {
  if (!item || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.name || "") ||
      !/^[a-f0-9]{40}$/.test(commit || "") ||
      !/^[a-f0-9]{40}$/.test(item.sha || "") ||
      !item.path?.startsWith("optimized/24/outline/") ||
      !/^MIT License\s+Copyright \(c\) Tailwind Labs, Inc\./.test(licenseText || "") ||
      typeof item.svg !== "string" || !item.svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"') ||
      typeof item.sourceSvg !== "string") {
    throw new Error("Heroicons outline resource is incomplete or unverified.");
  }
  const policy = getSourcePolicy("heroicons");
  if (policy.mirrorMode !== "full" || policy.licenseId !== "MIT")
    throw new Error("Heroicons mirroring is not approved.");
  const fetchedAt = new Date().toISOString();
  const keywords = ["heroicons", "outline", "icon", ...item.name.split("-")];
  return {
    schemaVersion: "1.0",
    id: "heroicons:" + item.name,
    slug: "heroicons-" + item.name,
    name: item.name,
    title: title(item.name),
    description: "Ícono de contorno editable (Heroicons 24)",
    family: "icon",
    kind: "icon",
    source: {
      provider: "heroicons",
      externalId: item.name,
      sourceUrl: "https://github.com/tailwindlabs/heroicons/blob/" + commit + "/" + item.path,
      repositoryUrl: "https://github.com/tailwindlabs/heroicons",
      fetchedAt,
      commit
    },
    license: {
      id: policy.licenseId,
      name: policy.licenseName,
      url: policy.licenseUrl,
      commercialUse: true,
      modificationAllowed: true,
      redistributionAllowed: true,
      attributionRequired: true,
      attributionText: "Heroicons © Tailwind Labs, Inc. · MIT License (LICENSE.txt)",
      verified: true
    },
    taxonomy: { categories: ["icon", "outline"], tags: keywords,
      sourceCategories: ["24-outline"] },
    previews: [],
    artifacts: [
      { id: "svg", role: "icon-data", format: "svg", mimeType: "image/svg+xml",
        content: item.svg, targetPath: "icon.svg",
        checksum: "sha256:" + sha256(item.svg) },
      { id: "upstream", role: "source", format: "svg", mimeType: "image/svg+xml",
        content: item.sourceSvg, targetPath: "upstream.svg",
        checksum: "git-sha1:" + item.sha },
      { id: "license", role: "license", format: "txt", mimeType: "text/plain",
        content: licenseText, targetPath: "LICENSE.txt",
        checksum: "sha256:" + sha256(licenseText) }
    ],
    runtime: { type: "svg", renderer: "nagweb-svg", entryArtifactId: "svg" },
    editableProps: [
      { id: "size", label: "Tamaño", group: "Icono", valueType: "number",
        control: "slider", defaultValue: 24,
        binding: { type: "runtime", path: "svg.size" },
        constraints: { min: 4, max: 512, step: 1, unit: "px" },
        responsive: true, animatable: true },
      { id: "stroke", label: "Color de trazo", group: "Icono", valueType: "color",
        control: "color", defaultValue: "#000000",
        binding: { type: "runtime", path: "svg.stroke" },
        responsive: true, animatable: true },
      { id: "strokeWidth", label: "Grosor", group: "Icono", valueType: "number",
        control: "slider", defaultValue: 1.5,
        binding: { type: "runtime", path: "svg.strokeWidth" },
        constraints: { min: 0.25, max: 8, step: 0.25 },
        responsive: true, animatable: true }
    ],
    compatibility: { nagweb: { supported: true, renderer: "svg", tested: false } },
    capabilities: ["editable-colors", "transformable", "animatable"],
    technical: { type: "icon", viewBox: "0 0 24 24", format: "svg", style: "outline" },
    search: { text: [title(item.name), ...keywords].join(" "), keywords },
    ingestion: { extractor: "heroicons", extractorVersion: "1.0.0",
      fetchedAt, transformedAt: fetchedAt, sourceHash: sha256(item.sourceSvg),
      status: "validated", warnings: [] },
    sourceData: { sourceSha: item.sha, originalPath: item.path, variant: "24-outline" }
  };
}
