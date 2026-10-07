import { createHash } from "node:crypto";
import { inferEditablePropsFromTsx } from "./analyzers/tsx-editable-props.mjs";
import { getSourcePolicy } from "./vault/source-policies.mjs";

const EXTRACTOR_VERSION = "0.2.0";

function now() {
  return new Date().toISOString();
}

function hash(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function titleFromSlug(slug) {
  return String(slug)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function transformLucideIcon({ item, commit }) {
  const fetchedAt = now();
  const policy = getSourcePolicy("lucide");
  const tags = item.meta?.tags || [];
  const categories = item.meta?.categories || [];

  return {
    schemaVersion: "1.0",
    id: `lucide:${item.name}`,
    slug: `lucide-${item.name}`,
    name: item.name,
    title: titleFromSlug(item.name),
    description: "",
    family: "icon",
    kind: "icon",
    source: {
      provider: "lucide",
      externalId: item.name,
      sourceUrl: `https://lucide.dev/icons/${item.name}`,
      repositoryUrl: "https://github.com/lucide-icons/lucide",
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
      attributionText: "Lucide Icons and Contributors · ISC License",
      verified: true
    },
    taxonomy: {
      categories,
      tags,
      sourceCategories: categories
    },
    previews: [],
    artifacts: [
      {
        id: "svg",
        role: "icon-data",
        format: "svg",
        mimeType: "image/svg+xml",
        content: item.svg,
        targetPath: "icon.svg",
        checksum: `git-sha1:${item.svgSha}`
      },
      {
        id: "metadata",
        role: "metadata",
        format: "json",
        mimeType: "application/json",
        content: JSON.stringify(item.meta, null, 2),
        targetPath: "metadata.json",
        checksum: `git-sha1:${item.metaSha}`
      }
    ],
    runtime: {
      type: "svg",
      renderer: "nagweb-svg",
      entryArtifactId: "svg"
    },
    editableProps: [
      {
        id: "size",
        label: "Tamaño",
        group: "Icono",
        valueType: "number",
        control: "slider",
        defaultValue: 24,
        binding: { type: "runtime", path: "svg.size" },
        constraints: { min: 4, max: 512, step: 1, unit: "px" },
        responsive: true,
        animatable: true
      },
      {
        id: "stroke",
        label: "Color de trazo",
        group: "Icono",
        valueType: "color",
        control: "color",
        defaultValue: "#000000",
        binding: { type: "runtime", path: "svg.stroke" },
        responsive: true,
        animatable: true
      },
      {
        id: "strokeWidth",
        label: "Grosor",
        group: "Icono",
        valueType: "number",
        control: "slider",
        defaultValue: 2,
        binding: { type: "runtime", path: "svg.strokeWidth" },
        constraints: { min: 0.25, max: 8, step: 0.25 },
        responsive: true,
        animatable: true
      }
    ],
    compatibility: {
      nagweb: { supported: true, renderer: "svg", tested: false }
    },
    capabilities: ["editable-colors", "transformable", "animatable"],
    technical: {
      type: "icon",
      viewBox: "0 0 24 24",
      format: "svg"
    },
    search: {
      text: [item.name, ...tags, ...categories].join(" "),
      keywords: [...new Set([item.name, ...tags, ...categories])]
    },
    ingestion: {
      extractor: "lucide",
      extractorVersion: EXTRACTOR_VERSION,
      fetchedAt,
      transformedAt: now(),
      sourceHash: hash(`${item.svgSha}:${item.metaSha}`),
      status: "validated",
      warnings: []
    },
    sourceData: {
      contributors: item.meta?.contributors || []
    }
  };
}

export function transformMagicUiComponent({ registry, item }) {
  const fetchedAt = now();
  const policy = getSourcePolicy("magicui");
  const raw = item.raw;
  const code = item.files.map((file) => file.content || "").join("\n");
  const editableProps = inferEditablePropsFromTsx(code);
  const artifacts = item.files.map((file, index) => ({
    id: `component-${index + 1}`,
    role: "component",
    format: file.sourcePath.split(".").pop()?.toLowerCase(),
    mimeType: "text/plain",
    content: file.content,
    sourceUrl: file.sourceUrl,
    sourcePath: file.sourcePath,
    targetPath: file.target || file.path
  }));

  if (raw.css || raw.cssVars) {
    artifacts.push({
      id: "style-metadata",
      role: "metadata",
      format: "json",
      mimeType: "application/json",
      content: JSON.stringify({ css: raw.css || {}, cssVars: raw.cssVars || {} }, null, 2),
      targetPath: "style-metadata.json"
    });
  }

  const deps = [...(raw.dependencies || []), ...(raw.devDependencies || [])];

  return {
    schemaVersion: "1.0",
    id: `magicui:${raw.name}`,
    slug: `magicui-${raw.name}`,
    name: raw.name,
    title: raw.title || titleFromSlug(raw.name),
    description: raw.description || "",
    family: "ui",
    kind: "react-component",
    source: {
      provider: "magicui",
      externalId: raw.name,
      sourceUrl: `https://magicui.design/docs/components/${raw.name}`,
      repositoryUrl: registry.repository,
      fetchedAt,
      commit: registry.commit
    },
    license: {
      id: policy.licenseId,
      name: policy.licenseName,
      url: policy.licenseUrl,
      commercialUse: true,
      modificationAllowed: true,
      redistributionAllowed: true,
      attributionRequired: true,
      attributionText: "Magic UI · MIT License",
      verified: true
    },
    taxonomy: {
      categories: ["ui", "magic-ui"],
      tags: [
        raw.name,
        "react",
        "typescript",
        ...(deps.includes("motion") || deps.includes("framer-motion")
          ? ["motion", "animation"]
          : [])
      ],
      sourceCategories: [raw.type]
    },
    previews: [],
    artifacts,
    runtime: {
      type: "react",
      renderer: "nagweb-react",
      entryArtifactId: artifacts[0]?.id,
      dependencies: deps.map((name) => ({ name })),
      registryDependencies: raw.registryDependencies || [],
      cssVariables: raw.cssVars?.theme || raw.cssVars || {},
      setup: { css: raw.css || {} }
    },
    editableProps,
    compatibility: {
      nagweb: { supported: true, renderer: "react", tested: false },
      react: true,
      tailwind: true
    },
    capabilities: [
      "responsive",
      "supports-children",
      ...(editableProps.length ? ["interactive"] : []),
      ...(deps.includes("motion") || deps.includes("framer-motion")
        ? ["animatable"]
        : [])
    ],
    technical: {
      type: "ui",
      framework: "react",
      language: "tsx",
      styling: ["tailwind"],
      inferredEditableProps: editableProps.length
    },
    search: {
      text: [raw.title, raw.name, raw.description, ...deps].filter(Boolean).join(" "),
      keywords: [raw.name, "react", "magic-ui", ...deps]
    },
    ingestion: {
      extractor: "magicui",
      extractorVersion: EXTRACTOR_VERSION,
      fetchedAt,
      transformedAt: now(),
      sourceHash: hash(code + JSON.stringify(raw.css || {})),
      status: "validated",
      warnings: editableProps.length === 0
        ? ["No simple editable props were inferred automatically; manual enrichment may be needed."]
        : []
    },
    sourceData: {
      registryType: raw.type,
      rawRegistryItem: raw
    }
  };
}

export function transformLocalLottie({
  name,
  data,
  sourcePath,
  license = {
    id: "custom",
    name: "User supplied",
    commercialUse: false,
    modificationAllowed: false,
    attributionRequired: false,
    verified: false
  }
}) {
  const fetchedAt = now();
  const slug = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const content = JSON.stringify(data);

  return {
    schemaVersion: "1.0",
    id: `lottie-local:${slug}`,
    slug: `lottie-${slug}`,
    name: slug,
    title: name,
    description: "",
    family: "animation",
    kind: "lottie",
    source: {
      provider: "local",
      externalId: sourcePath || slug,
      fetchedAt
    },
    license,
    taxonomy: {
      categories: ["animation", "lottie"],
      tags: ["lottie", "json", "animation"]
    },
    previews: [],
    artifacts: [{
      id: "animation",
      role: "animation-data",
      format: "json",
      mimeType: "application/json",
      content,
      sourcePath,
      targetPath: "animation.json",
      checksum: `sha256:${hash(content)}`
    }],
    runtime: {
      type: "lottie",
      renderer: "dotlottie-web",
      entryArtifactId: "animation"
    },
    editableProps: [
      {
        id: "speed",
        label: "Velocidad",
        group: "Animación",
        valueType: "number",
        control: "slider",
        defaultValue: 1,
        binding: { type: "runtime", path: "lottie.speed" },
        constraints: { min: 0.1, max: 4, step: 0.1 },
        animatable: true
      },
      {
        id: "loop",
        label: "Repetir",
        group: "Animación",
        valueType: "boolean",
        control: "toggle",
        defaultValue: true,
        binding: { type: "runtime", path: "lottie.loop" }
      },
      {
        id: "autoplay",
        label: "Reproducción automática",
        group: "Animación",
        valueType: "boolean",
        control: "toggle",
        defaultValue: true,
        binding: { type: "runtime", path: "lottie.autoplay" }
      }
    ],
    compatibility: {
      nagweb: { supported: true, renderer: "lottie", tested: false }
    },
    capabilities: ["animatable", "responsive"],
    technical: {
      type: "lottie",
      version: data.v,
      frameRate: data.fr,
      inPoint: data.ip,
      outPoint: data.op,
      width: data.w,
      height: data.h,
      layers: Array.isArray(data.layers) ? data.layers.length : 0
    },
    search: {
      text: `${name} lottie animation json`,
      keywords: ["lottie", "animation", "json"]
    },
    ingestion: {
      extractor: "local-lottie",
      extractorVersion: EXTRACTOR_VERSION,
      fetchedAt,
      transformedAt: now(),
      sourceHash: hash(content),
      status: license.verified ? "validated" : "pending",
      warnings: license.verified
        ? []
        : ["License is not verified; keep private until rights are confirmed."]
    }
  };
}


export function transformMotionPrimitive({ repository, commit, item }) {
  const fetchedAt = now();
  const policy = getSourcePolicy("motion-primitives");
  const raw = item.raw || {};
  const files = raw.files || [];
  const code = files.map((file) => file.content || "").join("\n");
  const editableProps = inferEditablePropsFromTsx(code);
  const deps = [
    ...(raw.dependencies || []),
    ...(raw.devDependencies || [])
  ];

  const artifacts = files.map((file, index) => ({
    id: `component-${index + 1}`,
    role: "component",
    format: file.path?.split(".").pop()?.toLowerCase() || "tsx",
    mimeType: "text/plain",
    content: file.content || "",
    sourcePath: item.path,
    targetPath: file.path || `${raw.name || "component"}.tsx`
  }));

  if (raw.css || raw.cssVars || raw.tailwind) {
    artifacts.push({
      id: "style-metadata",
      role: "metadata",
      format: "json",
      mimeType: "application/json",
      content: JSON.stringify(
        {
          css: raw.css || {},
          cssVars: raw.cssVars || {},
          tailwind: raw.tailwind || {}
        },
        null,
        2
      ),
      targetPath: "style-metadata.json"
    });
  }

  const animated =
    deps.includes("motion") ||
    deps.includes("framer-motion") ||
    /animat|motion|cursor|carousel|transition|trail|glow/i.test(
      `${raw.name || ""} ${raw.description || ""}`
    );

  return {
    schemaVersion: "1.0",
    id: `motion-primitives:${raw.name}`,
    slug: `motion-primitives-${raw.name}`,
    name: raw.name,
    title: titleFromSlug(raw.name),
    description: raw.description || "",
    family: "ui",
    kind: "react-component",
    source: {
      provider: "motion-primitives",
      externalId: raw.name,
      sourceUrl: `https://motion-primitives.com/docs/${raw.name}`,
      repositoryUrl: repository,
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
      attributionText: "Motion Primitives · MIT License",
      verified: true
    },
    taxonomy: {
      categories: ["ui", "motion", "motion-primitives"],
      tags: [
        raw.name,
        "react",
        "motion",
        "animation",
        ...deps
      ],
      sourceCategories: [raw.type].filter(Boolean)
    },
    previews: [],
    artifacts,
    runtime: {
      type: "react",
      renderer: "nagweb-react",
      entryArtifactId: artifacts[0]?.id,
      dependencies: deps.map((name) => ({ name })),
      registryDependencies: raw.registryDependencies || [],
      cssVariables: raw.cssVars || {},
      setup: {
        tailwind: raw.tailwind || {},
        css: raw.css || {}
      }
    },
    editableProps,
    compatibility: {
      nagweb: {
        supported: true,
        renderer: "react",
        tested: false
      },
      react: true,
      tailwind: true
    },
    capabilities: [
      "responsive",
      "supports-children",
      "interactive",
      ...(animated ? ["animatable"] : [])
    ],
    technical: {
      type: "ui",
      framework: "react",
      language: "tsx",
      styling: ["tailwind"],
      inferredEditableProps: editableProps.length,
      registryPath: item.path
    },
    search: {
      text: [
        raw.name,
        raw.description,
        "motion primitives",
        ...deps
      ].filter(Boolean).join(" "),
      keywords: [
        raw.name,
        "motion",
        "animation",
        "react",
        ...deps
      ]
    },
    ingestion: {
      extractor: "motion-primitives",
      extractorVersion: EXTRACTOR_VERSION,
      fetchedAt,
      transformedAt: now(),
      sourceHash: hash(`${item.sha}:${code}`),
      status: "validated",
      warnings:
        editableProps.length === 0
          ? [
              "No simple editable props were inferred automatically; manual enrichment may be needed."
            ]
          : []
    },
    sourceData: {
      rawRegistryItem: raw
    }
  };
}


function animXyzEditableProps() {
  return [
    {
      id: "duration",
      label: "Duración",
      group: "Movimiento",
      valueType: "number",
      control: "slider",
      defaultValue: 0.5,
      binding: { type: "runtime", path: "motion.duration" },
      constraints: { min: 0.05, max: 5, step: 0.05, unit: "s" },
      animatable: false
    },
    {
      id: "delay",
      label: "Demora",
      group: "Movimiento",
      valueType: "number",
      control: "slider",
      defaultValue: 0,
      binding: { type: "runtime", path: "motion.delay" },
      constraints: { min: 0, max: 5, step: 0.05, unit: "s" },
      animatable: false
    },
    {
      id: "ease",
      label: "Curva",
      group: "Movimiento",
      valueType: "enum",
      control: "select",
      defaultValue: "ease",
      binding: { type: "runtime", path: "motion.ease" },
      constraints: {
        options: [
          { label: "Ease", value: "ease" },
          { label: "Linear", value: "linear" },
          { label: "Ease in", value: "ease-in" },
          { label: "Ease out", value: "ease-out" },
          { label: "Ease in-out", value: "ease-in-out" }
        ]
      }
    }
  ];
}

export function transformAnimXyzCore(raw) {
  const fetchedAt = now();
  const policy = getSourcePolicy("animxyz");

  return {
    schemaVersion: "1.0",
    id: "animxyz:core",
    slug: "animxyz-core",
    name: "animxyz-core",
    title: "AnimXYZ Core",
    description: "Composable CSS/SCSS animation engine mirrored for NagWeb.",
    family: "animation",
    kind: "motion-preset",
    source: {
      provider: "animxyz",
      externalId: "core",
      sourceUrl: "https://animxyz.com",
      repositoryUrl: raw.repository,
      fetchedAt,
      commit: raw.commit
    },
    license: {
      id: policy.licenseId,
      name: policy.licenseName,
      url: policy.licenseUrl,
      commercialUse: true,
      modificationAllowed: true,
      redistributionAllowed: true,
      attributionRequired: true,
      attributionText: "AnimXYZ · MIT License",
      verified: true
    },
    taxonomy: {
      categories: ["animation", "css", "motion"],
      tags: ["animxyz", "css", "scss", "animation", "motion"]
    },
    previews: [],
    artifacts: raw.files.map((file, index) => ({
      id: `source-${index + 1}`,
      role: "source",
      format: file.path.split(".").pop()?.toLowerCase(),
      mimeType: "text/plain",
      content: file.content,
      sourceUrl: file.url,
      sourcePath: file.path,
      targetPath: file.path.replace("packages/core/", "")
    })),
    runtime: {
      type: "css",
      renderer: "nagweb-css-motion"
    },
    editableProps: [],
    compatibility: {
      nagweb: { supported: true, renderer: "css-motion", tested: false }
    },
    capabilities: ["animatable"],
    technical: {
      type: "motion-engine-source",
      nativePresetCount: raw.presets.length
    },
    search: {
      text: "AnimXYZ CSS SCSS composable animation motion",
      keywords: ["animxyz", "css", "scss", "animation", "motion"]
    },
    ingestion: {
      extractor: "animxyz",
      extractorVersion: EXTRACTOR_VERSION,
      fetchedAt,
      transformedAt: now(),
      sourceHash: hash(raw.files.map((file) => file.content).join("\n")),
      status: "validated",
      warnings: []
    }
  };
}

export function transformAnimXyzPreset({ preset, commit, repository }) {
  const fetchedAt = now();
  const policy = getSourcePolicy("animxyz");
  const motionSpec = {
    schema: "nagweb-motion-preset/0.1",
    sourceSemantic: `animxyz:${preset.name}`,
    direction: "in",
    duration: 0.5,
    delay: 0,
    ease: "ease",
    tracks: preset.tracks
  };

  return {
    schemaVersion: "1.0",
    id: `animxyz:preset:${preset.name}`,
    slug: `animxyz-${preset.name}`,
    name: preset.name,
    title: titleFromSlug(preset.name),
    description: `NagWeb native motion preset derived from AnimXYZ utility "${preset.name}".`,
    family: "animation",
    kind: "motion-preset",
    source: {
      provider: "animxyz",
      externalId: `preset/${preset.name}`,
      sourceUrl: "https://animxyz.com/docs",
      repositoryUrl: repository,
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
      attributionText: "Derived from AnimXYZ utility semantics · MIT License",
      verified: true
    },
    taxonomy: {
      categories: ["animation", "motion-preset", "css-derived"],
      tags: [preset.name, "motion", "animation", "animxyz"]
    },
    previews: [],
    artifacts: [{
      id: "preset",
      role: "animation-data",
      format: "json",
      mimeType: "application/json",
      content: JSON.stringify(motionSpec, null, 2),
      targetPath: "preset.json"
    }],
    runtime: {
      type: "none",
      renderer: "nagweb-motion-native",
      entryArtifactId: "preset",
      setup: motionSpec
    },
    editableProps: animXyzEditableProps(),
    compatibility: {
      nagweb: {
        supported: true,
        renderer: "motion-native",
        tested: false
      }
    },
    capabilities: ["animatable"],
    technical: {
      type: "motion-preset",
      nativeSchema: motionSpec.schema,
      tracks: preset.tracks
    },
    search: {
      text: `${preset.name} animxyz motion animation preset`,
      keywords: [preset.name, "animxyz", "motion", "animation"]
    },
    ingestion: {
      extractor: "animxyz-native",
      extractorVersion: EXTRACTOR_VERSION,
      fetchedAt,
      transformedAt: now(),
      sourceHash: hash(JSON.stringify(motionSpec)),
      status: "validated",
      warnings: [
        "Native preset is an interoperability layer; final MotionLab adapter should map nagweb-motion-preset/0.1 into the current MotionLab model."
      ]
    }
  };
}
