import { flattenPolyHavenFiles } from "./extractors/polyhaven.mjs";
import {
  flattenAmbientCgDownloads,
  selectAmbientCgDownload
} from "./extractors/ambientcg.mjs";
import { selectPmndrsEntryFile } from "./extractors/pmndrs.mjs";

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


function ambientCgMaterialEditableProps() {
  return [
    {
      id: "tiling",
      label: "Repetición",
      group: "Material",
      valueType: "number",
      control: "slider",
      defaultValue: 1,
      binding: { type: "runtime", path: "material.textureRepeat" },
      constraints: { min: 0.1, max: 20, step: 0.1 },
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

function ambientCgModelEditableProps() {
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
    }
  ];
}

export function transformAmbientCgAsset(asset) {
  const fetchedAt = now();
  const isModel = String(asset.dataType).toLowerCase() === "3dmodel";
  const downloads = flattenAmbientCgDownloads(asset);
  const selected = selectAmbientCgDownload(asset, {
    resolution: "1K",
    fileType: "JPG"
  });

  const previewUrl =
    asset.previewImage?.["512-WEBP"] ||
    asset.previewImage?.["512-JPG-FFFFFF"] ||
    asset.previewImage?.["256-WEBP"];

  const downloadArtifacts = downloads.map((download, index) => ({
    id: `download-${index + 1}`,
    role: isModel ? "model" : "material",
    format:
      download.fileName.split(".").pop()?.toLowerCase() ||
      "zip",
    sourceUrl: download.url,
    targetPath: download.fileName,
    size: download.size,
    checksum: download.checksum,
    variant: {
      attribute: download.attribute,
      category: download.category
    }
  }));

  const selectedArtifact = selected
    ? downloadArtifacts.find((artifact) => artifact.sourceUrl === selected.url)
    : undefined;

  return {
    schemaVersion: "1.0",
    id: `ambientcg:${asset.assetId}`,
    slug: slugify(asset.assetId),
    name: asset.assetId,
    title: asset.displayName || asset.assetId,
    description: asset.description || asset.dataTypeDescription || "",
    family: isModel ? "3d" : "material",
    kind: isModel ? "model-3d" : "pbr-material",
    source: {
      provider: "ambientcg",
      externalId: asset.assetId,
      sourceUrl: asset.shortLink || `https://ambientcg.com/a/${asset.assetId}`,
      apiUrl: "https://ambientcg.com/api/v2/full_json",
      author: "ambientCG",
      fetchedAt
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
      categories: [
        asset.dataType,
        asset.displayCategory || asset.category
      ].filter(Boolean),
      tags: asset.tags || [],
      sourceCategories: [asset.category, asset.displayCategory].filter(Boolean)
    },
    previews: previewUrl
      ? [{ type: "thumbnail", url: previewUrl }]
      : [],
    artifacts: [
      ...(previewUrl
        ? [{
            id: "thumbnail",
            role: "thumbnail",
            format: extensionFromUrl(previewUrl) || "webp",
            sourceUrl: previewUrl
          }]
        : []),
      ...downloadArtifacts
    ],
    runtime: {
      type: "three",
      renderer: "react-three-fiber",
      entryArtifactId: selectedArtifact?.id
    },
    editableProps: isModel
      ? ambientCgModelEditableProps()
      : ambientCgMaterialEditableProps(),
    compatibility: {
      nagweb: {
        supported: true,
        renderer: "three",
        tested: false
      },
      three: true,
      r3f: true
    },
    capabilities: isModel
      ? [
          "three-dimensional",
          "transformable",
          "editable-materials",
          "editable-textures",
          "animatable"
        ]
      : [
          "editable-materials",
          "editable-textures",
          "animatable"
        ],
    technical: {
      type: isModel ? "model-3d" : "pbr-material",
      ambientCgDataType: asset.dataType,
      creationMethod: asset.creationMethod,
      maps: asset.maps || [],
      hasUsd: Boolean(asset.hasUsd),
      dimensions: {
        x: Number(asset.dimensionX || 0),
        y: Number(asset.dimensionY || 0),
        z: Number(asset.dimensionZ || 0)
      },
      selectedDownload: selected
        ? {
            attribute: selected.attribute,
            fileName: selected.fileName,
            category: selected.category
          }
        : null
    },
    search: {
      text: [
        asset.displayName,
        asset.description,
        asset.displayCategory,
        ...(asset.tags || [])
      ].filter(Boolean).join(" "),
      keywords: asset.tags || [],
      semanticText: [
        asset.displayName,
        asset.dataTypeName,
        asset.displayCategory,
        asset.description
      ].filter(Boolean).join(". "),
      popularity: Number(asset.downloadCount || asset.popularityScore || 0)
    },
    ingestion: {
      extractor: "ambientcg",
      extractorVersion: EXTRACTOR_VERSION,
      fetchedAt,
      transformedAt: now(),
      status: "validated",
      warnings: selected
        ? []
        : ["No downloadable package was returned by ambientCG for this asset."]
    },
    sourceData: {
      releaseDate: asset.releaseDate,
      earlyReleaseDate: asset.earlyReleaseDate,
      creationMethod: asset.creationMethod,
      previewType: asset.previewType,
      variations: asset.variations || []
    }
  };
}


function pmndrsHdriEditableProps() {
  return [
    {
      id: "rotation",
      label: "Rotación",
      group: "Entorno",
      valueType: "number",
      control: "slider",
      defaultValue: 0,
      binding: { type: "runtime", path: "environment.rotation" },
      constraints: { min: -180, max: 180, step: 1, unit: "deg" },
      animatable: true
    },
    {
      id: "intensity",
      label: "Intensidad",
      group: "Entorno",
      valueType: "number",
      control: "slider",
      defaultValue: 1,
      binding: { type: "runtime", path: "environment.intensity" },
      constraints: { min: 0, max: 5, step: 0.01 },
      animatable: true
    }
  ];
}

function pmndrsLicense(licenseId) {
  if (Number(licenseId) === 1) {
    return {
      id: "CC0",
      name: "CC0 1.0",
      url: "https://creativecommons.org/publicdomain/zero/1.0/",
      commercialUse: true,
      modificationAllowed: true,
      redistributionAllowed: true,
      attributionRequired: false,
      verified: true
    };
  }

  if (Number(licenseId) === 2) {
    return {
      id: "CC-BY-2.0",
      name: "Creative Commons Attribution 2.0",
      url: "https://creativecommons.org/licenses/by/2.0/",
      commercialUse: true,
      modificationAllowed: true,
      redistributionAllowed: true,
      attributionRequired: true,
      verified: true
    };
  }

  return {
    id: "unknown",
    commercialUse: false,
    modificationAllowed: false,
    attributionRequired: true,
    verified: false
  };
}

export function transformPmndrsAsset(asset) {
  const fetchedAt = now();
  const info = asset.info || {};
  const entryFile = selectPmndrsEntryFile(asset);
  const thumbnail = asset.files.find((file) =>
    /thumbnail\.(png|jpe?g|webp)$/i.test(file.relativePath)
  );

  const kind =
    asset.type === "models"
      ? "model-3d"
      : asset.type === "hdris"
        ? "hdri"
        : "pbr-material";

  const family =
    asset.type === "models"
      ? "3d"
      : asset.type === "hdris"
        ? "hdri"
        : "material";

  const artifacts = asset.files
    .filter((file) => file.relativePath !== "info.json")
    .map((file, index) => {
      const isThumbnail =
        /thumbnail\.(png|jpe?g|webp)$/i.test(file.relativePath);

      return {
        id: `file-${index + 1}`,
        role: isThumbnail
          ? "thumbnail"
          : asset.type === "models"
            ? "model"
            : asset.type === "hdris"
              ? "source"
              : "material",
        format: file.relativePath.split(".").pop()?.toLowerCase(),
        sourceUrl: file.url,
        sourcePath: file.path,
        targetPath: file.relativePath,
        size: file.size,
        checksum: file.sha ? `git-sha1:${file.sha}` : undefined
      };
    });

  const entryArtifact = entryFile
    ? artifacts.find((artifact) => artifact.sourceUrl === entryFile.url)
    : undefined;

  const creator =
    typeof info.creator === "string"
      ? info.creator
      : info.creator?.name || info.team || "pmndrs";

  return {
    schemaVersion: "1.0",
    id: `pmndrs:${asset.type}:${asset.slug}`,
    slug: slugify(`${asset.type}-${asset.slug}`),
    name: asset.slug,
    title: info.name || asset.slug,
    description: info.description || "",
    family,
    kind,
    source: {
      provider: "pmndrs",
      externalId: `${asset.type}/${asset.slug}`,
      sourceUrl: `https://market.pmnd.rs/${asset.type.slice(0, -1)}/${asset.slug}`,
      repositoryUrl: "https://github.com/pmndrs/market-assets",
      author: creator,
      fetchedAt
    },
    license: pmndrsLicense(info.license),
    taxonomy: {
      categories: [asset.type, info.category].filter(Boolean),
      tags: [
        asset.type,
        info.category,
        asset.slug,
        creator
      ].filter(Boolean),
      sourceCategories: [info.category].filter(Boolean)
    },
    previews: thumbnail
      ? [{ type: "thumbnail", url: thumbnail.url }]
      : [],
    artifacts,
    runtime: {
      type: "three",
      renderer: "react-three-fiber",
      entryArtifactId: entryArtifact?.id
    },
    editableProps:
      asset.type === "models"
        ? ambientCgModelEditableProps()
        : asset.type === "hdris"
          ? pmndrsHdriEditableProps()
          : ambientCgMaterialEditableProps(),
    compatibility: {
      nagweb: {
        supported: true,
        renderer: "three",
        tested: false
      },
      three: true,
      r3f: true
    },
    capabilities:
      asset.type === "models"
        ? [
            "three-dimensional",
            "transformable",
            "editable-materials",
            "editable-textures",
            "animatable"
          ]
        : asset.type === "hdris"
          ? ["animatable"]
          : ["editable-materials", "editable-textures", "animatable"],
    technical: {
      type: kind,
      sourceCollection: asset.type,
      sourceTreeFiles: asset.files.length,
      entryFile: entryFile?.relativePath || null,
      creatorLink:
        typeof info.creator === "object"
          ? info.creator?.link || null
          : null,
      team: info.team || null
    },
    search: {
      text: [
        info.name,
        info.description,
        info.category,
        asset.slug,
        creator
      ].filter(Boolean).join(" "),
      keywords: [
        asset.slug,
        asset.type,
        info.category,
        creator
      ].filter(Boolean)
    },
    ingestion: {
      extractor: "pmndrs",
      extractorVersion: EXTRACTOR_VERSION,
      fetchedAt,
      transformedAt: now(),
      status: Number(info.license) === 1 ? "validated" : "pending",
      warnings: [
        ...(info._warning ? [info._warning] : []),
        ...(Number(info.license) === 1
          ? []
          : ["Asset is not CC0; review license before publishing."])
      ]
    },
    sourceData: {
      info,
      repositoryPath: `files/${asset.type}/${asset.slug}`
    }
  };
}
