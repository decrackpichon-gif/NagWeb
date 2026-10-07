import { flattenPolyHavenFiles } from "./extractors/polyhaven.mjs";

const EXTRACTOR_VERSION = "0.1.0";

function now() {
  return new Date().toISOString();
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extensionFromUrl(url) {
  try {
    const filename = new URL(url).pathname.split("/").pop() || "";
    return filename.includes(".") ? filename.split(".").pop().toLowerCase() : undefined;
  } catch {
    return undefined;
  }
}

function polyHavenEditableProps() {
  return [
    {
      id: "position",
      label: "Posición",
      group: "Transformación",
      valueType: "vector3",
      control: "vector3",
      defaultValue: [0, 0, 0],
      binding: { type: "transform", property: "position", axis: "xyz" },
      animatable: true
    },
    {
      id: "rotation",
      label: "Rotación",
      group: "Transformación",
      valueType: "vector3",
      control: "rotation",
      defaultValue: [0, 0, 0],
      binding: { type: "transform", property: "rotation", axis: "xyz" },
      animatable: true
    },
    {
      id: "scale",
      label: "Escala",
      group: "Transformación",
      valueType: "number",
      control: "slider",
      defaultValue: 1,
      binding: { type: "transform", property: "scale", axis: "xyz" },
      constraints: { min: 0.01, max: 10, step: 0.01 },
      animatable: true
    },
    {
      id: "roughness",
      label: "Rugosidad",
      group: "Material",
      valueType: "number",
      control: "slider",
      defaultValue: 1,
      binding: { type: "material-property", property: "roughness" },
      constraints: { min: 0, max: 1, step: 0.01 },
      animatable: true
    },
    {
      id: "metalness",
      label: "Metalizado",
      group: "Material",
      valueType: "number",
      control: "slider",
      defaultValue: 0,
      binding: { type: "material-property", property: "metalness" },
      constraints: { min: 0, max: 1, step: 0.01 },
      animatable: true
    }
  ];
}

function shadcnEditableProps(item) {
  const props = [
    {
      id: "opacity",
      label: "Opacidad",
      group: "Apariencia",
      valueType: "number",
      control: "slider",
      defaultValue: 1,
      binding: { type: "css-property", property: "opacity" },
      constraints: { min: 0, max: 1, step: 0.01 },
      responsive: true,
      animatable: true
    }
  ];

  if (item.name === "button") {
    props.unshift({
      id: "label",
      label: "Texto",
      group: "Contenido",
      valueType: "string",
      control: "text",
      defaultValue: "Button",
      binding: { type: "text-content" },
      responsive: false,
      animatable: false
    });
  }

  return props;
}

export function transformPolyHavenModel({ id, meta, files }) {
  const fetchedAt = now();
  const fileArtifacts = flattenPolyHavenFiles(files || {}).map((file, index) => ({
    id: `file-${index + 1}`,
    role: file.role,
    format: extensionFromUrl(file.url),
    sourceUrl: file.url,
    sourcePath: file.sourcePath,
    targetPath: file.path,
    size: file.size,
    checksum: file.md5 ? `md5:${file.md5}` : undefined
  }));

  const artifacts = [
    ...(meta.thumbnail_url
      ? [
          {
            id: "thumbnail",
            role: "thumbnail",
            format: extensionFromUrl(meta.thumbnail_url) || "webp",
            sourceUrl: meta.thumbnail_url
          }
        ]
      : []),
    ...fileArtifacts
  ];

  const entryArtifact = artifacts.find((artifact) =>
    ["glb", "gltf"].includes(artifact.format)
  );

  return {
    schemaVersion: "1.0",
    id: `polyhaven:${id}`,
    slug: slugify(id),
    name: meta.name || id,
    title: meta.name || id,
    description: meta.description || "",
    family: "3d",
    kind: "model-3d",
    source: {
      provider: "polyhaven",
      externalId: id,
      sourceUrl: `https://polyhaven.com/a/${id}`,
      apiUrl: `https://api.polyhaven.com/files/${id}`,
      author: Object.keys(meta.authors || {}).join(", ") || undefined,
      fetchedAt,
      version: meta.files_hash || undefined
    },
    license: {
      id: "CC0",
      name: "CC0 1.0",
      url: "https://creativecommons.org/publicdomain/zero/1.0/",
      commercialUse: true,
      modificationAllowed: true,
      redistributionAllowed: true,
      attributionRequired: false,
      verified: true
    },
    taxonomy: {
      categories: meta.category ? meta.category.split("/") : meta.categories || [],
      tags: meta.tags || [],
      sourceCategories: meta.categories || []
    },
    previews: meta.thumbnail_url
      ? [{ type: "thumbnail", url: meta.thumbnail_url }]
      : [],
    artifacts,
    runtime: {
      type: "three",
      renderer: "react-three-fiber",
      entryArtifactId: entryArtifact?.id
    },
    editableProps: polyHavenEditableProps(),
    compatibility: {
      nagweb: { supported: true, renderer: "three", tested: false },
      three: true,
      r3f: true
    },
    capabilities: [
      "three-dimensional",
      "transformable",
      "editable-materials",
      "editable-textures",
      "animatable"
    ],
    technical: {
      type: "model-3d",
      polycount: meta.polycount,
      maxResolution: meta.max_resolution,
      dimensionsMm: meta.dimensions,
      attributes: meta.attributes || {},
      filesHash: meta.files_hash
    },
    search: {
      text: [meta.name, meta.description, ...(meta.tags || [])]
        .filter(Boolean)
        .join(" "),
      keywords: meta.tags || [],
      semanticText: [meta.name, meta.description, meta.category]
        .filter(Boolean)
        .join(". "),
      popularity: Number(meta.download_count || 0)
    },
    ingestion: {
      extractor: "polyhaven",
      extractorVersion: EXTRACTOR_VERSION,
      fetchedAt,
      transformedAt: now(),
      sourceHash: meta.files_hash || undefined,
      status: "validated",
      warnings: []
    },
    sourceData: {
      datePublished: meta.date_published,
      categoryId: meta.category_id,
      attributes: meta.attributes || {}
    }
  };
}

export function transformShadcnItem({ registry, item }) {
  const fetchedAt = now();
  const raw = item.raw;

  const artifacts = item.files.map((file, index) => ({
    id: `component-${index + 1}`,
    role: "component",
    format: file.path.split(".").pop()?.toLowerCase(),
    sourceUrl: file.sourceUrl,
    sourcePath: file.path,
    targetPath: file.target || file.path,
    content: file.content
  }));

  return {
    schemaVersion: "1.0",
    id: `shadcn:${raw.name}`,
    slug: slugify(raw.name),
    name: raw.name,
    title: raw.title || raw.name,
    description: raw.description || "",
    family: "ui",
    kind: "react-component",
    source: {
      provider: "shadcn",
      externalId: raw.name,
      sourceUrl: "https://ui.shadcn.com/docs/components",
      repositoryUrl: "https://github.com/shadcn-ui/ui",
      fetchedAt
    },
    license: {
      id: "MIT",
      name: "MIT License",
      url: "https://github.com/shadcn-ui/ui/blob/main/LICENSE.md",
      commercialUse: true,
      modificationAllowed: true,
      redistributionAllowed: true,
      attributionRequired: true,
      verified: true
    },
    taxonomy: {
      categories: ["ui", raw.type || "registry:ui"],
      tags: [raw.name, "react", "shadcn", "ui"]
    },
    previews: [],
    artifacts,
    runtime: {
      type: "react",
      renderer: "nagweb-react",
      entryArtifactId: artifacts[0]?.id,
      dependencies: [
        ...(raw.dependencies || []),
        ...(raw.devDependencies || [])
      ].map((name) => ({ name })),
      registryDependencies: raw.registryDependencies || [],
      cssVariables: raw.cssVars || {}
    },
    editableProps: shadcnEditableProps(raw),
    compatibility: {
      nagweb: { supported: true, renderer: "react", tested: false },
      react: true,
      tailwind: true
    },
    capabilities: ["responsive", "interactive", "supports-children"],
    technical: {
      type: "ui",
      framework: "react",
      language: "tsx",
      styling: ["tailwind"],
      registryType: raw.type
    },
    search: {
      text: [raw.title, raw.name, raw.description].filter(Boolean).join(" "),
      keywords: [raw.name, "react", "shadcn", "ui"]
    },
    ingestion: {
      extractor: "shadcn",
      extractorVersion: EXTRACTOR_VERSION,
      fetchedAt,
      transformedAt: now(),
      status: "validated",
      warnings:
        raw.name === "button"
          ? []
          : [
              "editableProps uses baseline NagWeb wrapper controls; semantic prop inference is pending."
            ]
    },
    sourceData: {
      registryName: registry.name,
      registryHomepage: registry.homepage,
      registryType: raw.type
    }
  };
}
