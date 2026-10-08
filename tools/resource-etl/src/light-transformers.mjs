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


export function transformThreeCodeScene({ repository, commit, item }) {
  const fetchedAt = now();
  const policy = getSourcePolicy("threejs");
  const name = item.path
    .replace(/^examples\//, "")
    .replace(/\.html$/, "");
  const isShader = /shader/i.test(name);
  const titleMatch = item.html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.replace(/^three\.js\s*/i, "").trim() || titleFromSlug(name);

  return {
    schemaVersion: "1.0",
    id: `threejs:example:${name}`,
    slug: `threejs-${name}`,
    name,
    title,
    description: "Code-only Three.js example mirrored for offline NagWeb use.",
    family: isShader ? "animation" : "3d",
    kind: isShader ? "shader" : "code-scene",
    source: {
      provider: "threejs",
      externalId: item.path,
      sourceUrl: `https://threejs.org/examples/#${name}`,
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
      attributionText: "three.js authors · MIT License",
      verified: true
    },
    taxonomy: {
      categories: [
        "three.js",
        isShader ? "shader" : "scene",
        name.split("_")[0]
      ],
      tags: [
        name,
        "three.js",
        "webgl",
        ...(isShader ? ["shader", "glsl"] : [])
      ]
    },
    previews: [],
    artifacts: [{
      id: "scene-source",
      role: "source",
      format: "html",
      mimeType: "text/html",
      content: item.html,
      sourcePath: item.path,
      targetPath: `${name}.html`,
      checksum: `git-sha1:${item.sha}`
    }],
    runtime: {
      type: "three",
      renderer: "three",
      entryArtifactId: "scene-source",
      dependencies: [{ name: "three" }],
      imports: item.analysis.imports,
      setup: {
        codeOnly: true,
        externalAssets: false
      }
    },
    editableProps: [
      {
        id: "speed",
        label: "Velocidad global",
        group: "Escena",
        valueType: "number",
        control: "slider",
        defaultValue: 1,
        binding: { type: "runtime", path: "scene.timeScale" },
        constraints: { min: 0, max: 4, step: 0.05 },
        animatable: true
      }
    ],
    compatibility: {
      nagweb: {
        supported: true,
        renderer: "three",
        tested: false
      },
      three: true
    },
    capabilities: [
      "three-dimensional",
      "interactive",
      "animatable"
    ],
    technical: {
      type: isShader ? "shader" : "code-scene",
      codeOnly: true,
      imports: item.analysis.imports,
      originalPath: item.path
    },
    search: {
      text: `${title} ${name} three.js code scene ${isShader ? "shader glsl" : ""}`,
      keywords: [
        name,
        "three.js",
        "webgl",
        ...(isShader ? ["shader", "glsl"] : [])
      ]
    },
    ingestion: {
      extractor: "threejs-code-only",
      extractorVersion: EXTRACTOR_VERSION,
      fetchedAt,
      transformedAt: now(),
      sourceHash: hash(item.html),
      status: "validated",
      warnings: [
        "Example source is code-only by static scan. Adapter work is still required before direct insertion into the NagWeb canvas."
      ]
    },
    sourceData: {
      codeOnlyAnalysis: item.analysis
    }
  };
}


export function transformHyperUiRuntime(raw) {
  const fetchedAt = now();
  const policy = getSourcePolicy("hyperui");

  return {
    schemaVersion: "1.0",
    id: "hyperui:runtime",
    slug: "hyperui-runtime",
    name: "hyperui-runtime",
    title: "HyperUI Runtime",
    description: "Shared CSS and tiny JavaScript helper mirrored for offline HyperUI blocks.",
    family: "ui",
    kind: "html-component",
    source: {
      provider: "hyperui",
      externalId: "runtime",
      sourceUrl: "https://www.hyperui.dev",
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
      attributionText: "HyperUI · MIT License",
      verified: true
    },
    taxonomy: {
      categories: ["ui", "runtime", "tailwind"],
      tags: ["hyperui", "tailwind", "html", "css"]
    },
    previews: [],
    artifacts: [
      {
        id: "component-css",
        role: "stylesheet",
        format: "css",
        mimeType: "text/css",
        content: raw.componentCss,
        targetPath: "component.css"
      },
      {
        id: "component-js",
        role: "script",
        format: "js",
        mimeType: "text/javascript",
        content: raw.componentJs,
        targetPath: "component.js"
      }
    ],
    runtime: {
      type: "html",
      renderer: "nagweb-html-tailwind"
    },
    editableProps: [],
    compatibility: {
      nagweb: { supported: true, renderer: "html", tested: false },
      tailwind: true
    },
    capabilities: ["responsive"],
    technical: {
      type: "hyperui-runtime"
    },
    search: {
      text: "HyperUI Tailwind HTML shared runtime",
      keywords: ["hyperui", "tailwind", "html", "css"]
    },
    ingestion: {
      extractor: "hyperui",
      extractorVersion: EXTRACTOR_VERSION,
      fetchedAt,
      transformedAt: now(),
      sourceHash: hash(raw.componentCss + raw.componentJs),
      status: "validated",
      warnings: []
    }
  };
}

export function transformHyperUiBlock({ repository, commit, item }) {
  const fetchedAt = now();
  const policy = getSourcePolicy("hyperui");
  const groupTitle = titleFromSlug(item.group);
  const blockTitle = `${groupTitle} ${item.index}`;
  const lightBody = item.lightAnalysis.body;
  const darkBody = item.darkAnalysis?.body || null;

  return {
    schemaVersion: "1.0",
    id: `hyperui:${item.collection}:${item.group}:${item.index}`,
    slug: `hyperui-${item.collection}-${item.group}-${item.index}`,
    name: `${item.group}-${item.index}`,
    title: blockTitle,
    description: `HyperUI ${item.collection} block, stored as autonomous HTML/Tailwind code.`,
    family: "ui",
    kind: "html-component",
    source: {
      provider: "hyperui",
      externalId: item.key,
      sourceUrl: `https://www.hyperui.dev/components/${item.collection}/${item.group}`,
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
      attributionText: "HyperUI · MIT License",
      verified: true
    },
    taxonomy: {
      categories: ["ui", item.collection, item.group],
      tags: [
        "hyperui",
        "html",
        "tailwind",
        item.collection,
        item.group
      ],
      sourceCategories: [item.collection, item.group]
    },
    previews: [],
    artifacts: [
      {
        id: "html-light",
        role: "component",
        format: "html",
        mimeType: "text/html",
        content: lightBody,
        sourcePath: item.light.path,
        targetPath: "light.html",
        checksum: `git-sha1:${item.light.sha}`,
        variant: { theme: "light" }
      },
      ...(darkBody
        ? [{
            id: "html-dark",
            role: "component",
            format: "html",
            mimeType: "text/html",
            content: darkBody,
            sourcePath: item.dark.path,
            targetPath: "dark.html",
            checksum: `git-sha1:${item.dark.sha}`,
            variant: { theme: "dark" }
          }]
        : [])
    ],
    runtime: {
      type: "html",
      renderer: "nagweb-html-tailwind",
      entryArtifactId: "html-light",
      registryDependencies: ["hyperui:runtime"],
      setup: {
        themes: darkBody ? ["light", "dark"] : ["light"]
      }
    },
    editableProps: [
      {
        id: "theme",
        label: "Tema",
        group: "Apariencia",
        valueType: "enum",
        control: "segmented",
        defaultValue: "light",
        binding: { type: "runtime", path: "html.variant" },
        constraints: {
          options: darkBody
            ? [
                { label: "Claro", value: "light" },
                { label: "Oscuro", value: "dark" }
              ]
            : [{ label: "Claro", value: "light" }]
        }
      }
    ],
    compatibility: {
      nagweb: { supported: true, renderer: "html", tested: false },
      tailwind: true
    },
    capabilities: ["responsive", "supports-children"],
    technical: {
      type: "html-ui",
      collection: item.collection,
      group: item.group,
      index: item.index,
      codeOnly: true,
      hasDarkVariant: Boolean(darkBody)
    },
    search: {
      text: `${blockTitle} HyperUI ${item.collection} ${item.group} Tailwind HTML`,
      keywords: [
        "hyperui",
        item.collection,
        item.group,
        "tailwind",
        "html"
      ]
    },
    ingestion: {
      extractor: "hyperui",
      extractorVersion: EXTRACTOR_VERSION,
      fetchedAt,
      transformedAt: now(),
      sourceHash: hash(lightBody + (darkBody || "")),
      status: "validated",
      warnings: [
        "Text/color slot inference for raw HTML blocks is pending; code is mirrored and theme variants are available now."
      ]
    },
    sourceData: {
      codeOnly: true,
      lightAnalysis: item.lightAnalysis,
      darkAnalysis: item.darkAnalysis
    }
  };
}


export function transformCssShakeRuntime(raw) {
  const fetchedAt = now();
  const policy = getSourcePolicy("csshake");

  return {
    schemaVersion: "1.0",
    id: "csshake:runtime",
    slug: "csshake-runtime",
    name: "csshake-runtime",
    title: "CSSShake Runtime",
    description: "Complete CSSShake runtime mirrored for offline NagWeb use.",
    family: "animation",
    kind: "motion-preset",
    source: {
      provider: "csshake",
      externalId: "runtime",
      sourceUrl: "https://elrumordelaluz.github.io/csshake/",
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
      attributionText: "CSSShake · MIT License",
      verified: true
    },
    taxonomy: {
      categories: ["animation", "css", "hover"],
      tags: ["csshake", "css", "shake", "hover", "animation"]
    },
    previews: [],
    artifacts: [
      {
        id: "css",
        role: "stylesheet",
        format: "css",
        mimeType: "text/css",
        content: raw.css,
        targetPath: "csshake.css"
      },
      {
        id: "scss",
        role: "source",
        format: "scss",
        mimeType: "text/plain",
        content: raw.scss,
        targetPath: "csshake.scss"
      }
    ],
    runtime: {
      type: "css",
      renderer: "nagweb-css-runtime",
      entryArtifactId: "css"
    },
    editableProps: [],
    compatibility: {
      nagweb: { supported: true, renderer: "css", tested: false }
    },
    capabilities: ["animatable", "interactive"],
    technical: {
      type: "css-animation-runtime",
      effectCount: raw.effects.length,
      packageVersion: raw.packageJson?.version
    },
    search: {
      text: "CSSShake shake hover CSS animation",
      keywords: ["csshake", "css", "shake", "hover", "animation"]
    },
    ingestion: {
      extractor: "csshake",
      extractorVersion: EXTRACTOR_VERSION,
      fetchedAt,
      transformedAt: now(),
      sourceHash: hash(raw.css + raw.scss),
      status: "validated",
      warnings: []
    }
  };
}

export function transformCssShakeEffect({ raw, effect }) {
  const fetchedAt = now();
  const policy = getSourcePolicy("csshake");
  const spec = {
    schema: "nagweb-css-effect/0.1",
    className: effect.className,
    trigger: "hover",
    previewClassNames: [effect.className, "shake-constant"]
  };

  return {
    schemaVersion: "1.0",
    id: `csshake:${effect.name}`,
    slug: `csshake-${effect.name}`,
    name: effect.name,
    title: titleFromSlug(effect.name),
    description: `CSSShake effect "${effect.name}" ready for NagWeb elements.`,
    family: "animation",
    kind: "motion-preset",
    source: {
      provider: "csshake",
      externalId: effect.name,
      sourceUrl: "https://elrumordelaluz.github.io/csshake/",
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
      attributionText: "CSSShake · MIT License",
      verified: true
    },
    taxonomy: {
      categories: ["animation", "css-effect", "hover"],
      tags: [effect.name, "csshake", "shake", "hover"]
    },
    previews: [],
    artifacts: [{
      id: "effect",
      role: "animation-data",
      format: "json",
      mimeType: "application/json",
      content: JSON.stringify(spec, null, 2),
      targetPath: "effect.json"
    }],
    runtime: {
      type: "css",
      renderer: "nagweb-css-class-effect",
      entryArtifactId: "effect",
      registryDependencies: ["csshake:runtime"],
      setup: spec
    },
    editableProps: [
      {
        id: "trigger",
        label: "Activación",
        group: "Interacción",
        valueType: "enum",
        control: "select",
        defaultValue: "hover",
        binding: { type: "runtime", path: "cssEffect.trigger" },
        constraints: {
          options: [
            { label: "Hover", value: "hover" },
            { label: "Siempre", value: "constant" }
          ]
        }
      }
    ],
    compatibility: {
      nagweb: { supported: true, renderer: "css-effect", tested: false }
    },
    capabilities: ["animatable", "interactive"],
    technical: {
      type: "css-class-effect",
      className: effect.className
    },
    search: {
      text: `${effect.name} CSSShake hover animation`,
      keywords: [effect.name, "csshake", "hover", "animation"]
    },
    ingestion: {
      extractor: "csshake",
      extractorVersion: EXTRACTOR_VERSION,
      fetchedAt,
      transformedAt: now(),
      sourceHash: hash(JSON.stringify(spec)),
      status: "validated",
      warnings: []
    }
  };
}


export function transformGlslNoise({ repository, commit, item }) {
  const fetchedAt = now();
  const policy = getSourcePolicy("glsl-noise");
  const [familyName, dimensionFile] = item.path.split("/");
  const dimension = dimensionFile.replace(".glsl", "");
  const symbol = item.exportedSymbol || "noise";
  const title = `${titleFromSlug(familyName)} Noise ${dimension.toUpperCase()}`;

  return {
    schemaVersion: "1.0",
    id: `glsl-noise:${familyName}:${dimension}`,
    slug: `glsl-noise-${familyName}-${dimension}`,
    name: `${familyName}-${dimension}`,
    title,
    description: `${familyName} ${dimension.toUpperCase()} noise GLSL function for procedural shader composition.`,
    family: "animation",
    kind: "shader",
    source: {
      provider: "glsl-noise",
      externalId: item.path,
      sourceUrl: `https://github.com/hughsk/glsl-noise/blob/${commit}/${item.path}`,
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
      attributionText: "Ashima Arts / Stefan Gustavson / contributors · MIT License",
      verified: true
    },
    taxonomy: {
      categories: ["shader", "glsl", "noise", familyName],
      tags: [
        "glsl",
        "shader",
        "noise",
        familyName,
        dimension,
        symbol
      ]
    },
    previews: [],
    artifacts: [{
      id: "shader",
      role: "source",
      format: "glsl",
      mimeType: "text/plain",
      content: item.code,
      sourcePath: item.path,
      targetPath: "shader.glsl",
      checksum: `git-sha1:${item.sha}`
    }],
    runtime: {
      type: "three",
      renderer: "nagweb-glsl-snippet",
      entryArtifactId: "shader",
      setup: {
        exportedSymbol: symbol,
        family: familyName,
        dimension
      }
    },
    editableProps: [],
    compatibility: {
      nagweb: {
        supported: true,
        renderer: "glsl-snippet",
        tested: false
      },
      three: true
    },
    capabilities: ["animatable"],
    technical: {
      type: "shader",
      language: "glsl",
      exportedSymbol: symbol,
      noiseFamily: familyName,
      dimension
    },
    search: {
      text: `${title} GLSL shader procedural noise ${symbol}`,
      keywords: [
        "glsl",
        "shader",
        "noise",
        familyName,
        dimension,
        symbol
      ]
    },
    ingestion: {
      extractor: "glsl-noise",
      extractorVersion: EXTRACTOR_VERSION,
      fetchedAt,
      transformedAt: now(),
      sourceHash: hash(item.code),
      status: "validated",
      warnings: [
        "This is a reusable GLSL function, not a complete fragment/vertex shader. It must be composed into a material or shader graph."
      ]
    }
  };
}


export function transformUiverseComponent({ repository, commit, item }) {
  const fetchedAt = now();
  const policy = getSourcePolicy("uiverse");
  const meta = item.metadata || {};
  const category = meta.category || "Other";
  const slug = String(meta.slug || meta.filename || "component")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const authorSlug = String(meta.author || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "unknown";
  const content = String(item.content || "");
  const title = titleFromSlug(meta.slug || meta.filename || "component");

  return {
    schemaVersion: "1.0",
    id: `uiverse:${category.toLowerCase()}:${authorSlug}:${slug}`,
    slug: `uiverse-${category.toLowerCase()}-${authorSlug}-${slug}`,
    name: slug,
    title,
    description: `Autonomous ${category} component mirrored from Uiverse Galaxy.`,
    family: "ui",
    kind: "html-component",
    source: {
      provider: "uiverse",
      externalId: item.entry.path,
      sourceUrl: `${repository}/blob/${commit}/${item.entry.path}`,
      repositoryUrl: repository,
      author: meta.author,
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
      attributionRequired: false,
      attributionText: `Uiverse.io component by ${meta.author || "community creator"} · MIT License`,
      verified: true
    },
    taxonomy: {
      categories: ["ui", "uiverse", category.toLowerCase()],
      tags: [
        "uiverse",
        "html",
        "css",
        category.toLowerCase(),
        ...(meta.tags || [])
      ],
      sourceCategories: [category]
    },
    previews: [],
    artifacts: [{
      id: "component",
      role: "component",
      format: "html",
      mimeType: "text/html",
      content,
      sourcePath: item.entry.path,
      targetPath: "component.html",
      checksum: item.entry.sha ? `git-sha1:${item.entry.sha}` : undefined
    }],
    runtime: {
      type: "html",
      renderer: "nagweb-html-tailwind",
      entryArtifactId: "component"
    },
    editableProps: [
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
    ],
    compatibility: {
      nagweb: { supported: true, renderer: "html", tested: false },
      html: true,
      css: true
    },
    capabilities: ["responsive", "interactive", "animatable"],
    technical: {
      type: "html-css-ui",
      category,
      codeOnly: true,
      autonomous: true,
      bytes: content.length
    },
    search: {
      text: [
        title,
        category,
        meta.author,
        ...(meta.tags || []),
        "Uiverse HTML CSS"
      ].filter(Boolean).join(" "),
      keywords: [
        "uiverse",
        category.toLowerCase(),
        ...(meta.tags || [])
      ]
    },
    ingestion: {
      extractor: "uiverse",
      extractorVersion: EXTRACTOR_VERSION,
      fetchedAt,
      transformedAt: now(),
      sourceHash: hash(content),
      status: "validated",
      warnings: []
    },
    sourceData: {
      author: meta.author,
      originalPath: item.entry.path,
      originalFilename: meta.filename,
      tags: meta.tags || []
    }
  };
}


function magicCssEditableProps() {
  return [
    {
      id: "duration",
      label: "Duración",
      group: "Animación",
      valueType: "number",
      control: "slider",
      defaultValue: 1,
      binding: { type: "runtime", path: "cssEffect.duration" },
      constraints: { min: 0.1, max: 8, step: 0.1, unit: "s" }
    },
    {
      id: "delay",
      label: "Demora",
      group: "Animación",
      valueType: "number",
      control: "slider",
      defaultValue: 0,
      binding: { type: "runtime", path: "cssEffect.delay" },
      constraints: { min: 0, max: 5, step: 0.1, unit: "s" }
    },
    {
      id: "easing",
      label: "Curva",
      group: "Animación",
      valueType: "enum",
      control: "select",
      defaultValue: "ease",
      binding: { type: "runtime", path: "cssEffect.easing" },
      constraints: {
        options: [
          { label: "Ease", value: "ease" },
          { label: "Linear", value: "linear" },
          { label: "Ease in", value: "ease-in" },
          { label: "Ease out", value: "ease-out" },
          { label: "Ease in-out", value: "ease-in-out" }
        ]
      }
    },
    {
      id: "iterations",
      label: "Repeticiones",
      group: "Animación",
      valueType: "number",
      control: "slider",
      defaultValue: 1,
      binding: { type: "runtime", path: "cssEffect.iterations" },
      constraints: { min: 1, max: 10, step: 1 }
    }
  ];
}

export function transformMagicCssEffect({ raw, item }) {
  const fetchedAt = now();
  const policy = getSourcePolicy("magic-css");
  const category = String(item.category || "effect").replaceAll("_", "-");
  const css = `${raw.baseCss.trim()}\n\n${item.code.trim()}\n`;
  const spec = {
    schema: "nagweb-css-effect/0.2",
    className: item.name,
    baseClass: "magictime",
    category,
    replayable: true
  };

  return {
    schemaVersion: "1.0",
    id: `magic-css:${category}:${item.name}`,
    slug: `magic-css-${category}-${item.name}`
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-"),
    name: item.name,
    title: titleFromSlug(
      item.name.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    ),
    description: `Magic.css ${item.name} animation stored as autonomous CSS.`,
    family: "animation",
    kind: "motion-preset",
    source: {
      provider: "magic-css",
      externalId: item.path,
      sourceUrl: `${raw.repository}/blob/${raw.commit}/${item.path}`,
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
      attributionText: "Magic.css · Christian Pucci · MIT License",
      verified: true
    },
    taxonomy: {
      categories: ["animation", "css-effect", category],
      tags: [
        "magic-css",
        "css",
        "animation",
        category,
        item.name
      ],
      sourceCategories: [item.category]
    },
    previews: [],
    artifacts: [
      {
        id: "style",
        role: "stylesheet",
        format: "css",
        mimeType: "text/css",
        content: css,
        sourcePath: item.path,
        targetPath: "effect.css",
        checksum: item.sha ? `git-sha1:${item.sha}` : undefined
      },
      {
        id: "effect",
        role: "animation-data",
        format: "json",
        mimeType: "application/json",
        content: JSON.stringify(spec, null, 2),
        targetPath: "effect.json"
      }
    ],
    runtime: {
      type: "css",
      renderer: "nagweb-css-inline-effect",
      entryArtifactId: "style",
      setup: spec
    },
    editableProps: magicCssEditableProps(),
    compatibility: {
      nagweb: {
        supported: true,
        renderer: "css-inline-effect",
        tested: false
      },
      css: true
    },
    capabilities: ["animatable", "transformable"],
    technical: {
      type: "css-keyframe-effect",
      className: item.name,
      category,
      codeOnly: true,
      packageVersion: raw.packageJson?.version
    },
    search: {
      text: `${item.name} Magic.css ${category} CSS animation`,
      keywords: [
        item.name,
        "magic-css",
        "css",
        "animation",
        category
      ]
    },
    ingestion: {
      extractor: "magic-css",
      extractorVersion: EXTRACTOR_VERSION,
      fetchedAt,
      transformedAt: now(),
      sourceHash: hash(css),
      status: "validated",
      warnings: []
    }
  };
}


export function transformSpinKitLoader({ raw, item }) {
  const fetchedAt = now();
  const policy = getSourcePolicy("spinkit");
  const content = `<style>${raw.css}</style>\n${item.html}`;

  return {
    schemaVersion: "1.0",
    id: `spinkit:${item.name}`,
    slug: `spinkit-${item.name}`,
    name: item.name,
    title: item.title,
    description: `SpinKit CSS loader "${item.title}" stored as autonomous HTML/CSS.`,
    family: "animation",
    kind: "html-component",
    source: {
      provider: "spinkit",
      externalId: item.name,
      sourceUrl: `${raw.repository}#${item.name}`,
      repositoryUrl: raw.repository,
      fetchedAt,
      version: raw.packageJson?.version,
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
      attributionText: "SpinKit · Tobias Ahlin · MIT License",
      verified: true
    },
    taxonomy: {
      categories: ["animation", "loader", "css"],
      tags: [item.name, "spinkit", "loader", "spinner", "css", "animation"]
    },
    previews: [],
    artifacts: [{
      id: "component",
      role: "component",
      format: "html",
      mimeType: "text/html",
      content,
      sourcePath: "README.md",
      targetPath: "component.html"
    }],
    runtime: {
      type: "html",
      renderer: "nagweb-html-tailwind",
      entryArtifactId: "component",
      cssVariables: {
        "--sk-size": "40px",
        "--sk-color": "#333333"
      }
    },
    editableProps: [
      {
        id: "size",
        label: "Tamaño",
        group: "Loader",
        valueType: "number",
        control: "slider",
        defaultValue: 40,
        binding: { type: "css-variable", variable: "--sk-size" },
        constraints: { min: 8, max: 240, step: 1, unit: "px" },
        responsive: true,
        animatable: true
      },
      {
        id: "color",
        label: "Color",
        group: "Loader",
        valueType: "color",
        control: "color",
        defaultValue: "#333333",
        binding: { type: "css-variable", variable: "--sk-color" },
        responsive: true,
        animatable: true
      }
    ],
    compatibility: {
      nagweb: { supported: true, renderer: "html", tested: false },
      html: true,
      css: true
    },
    capabilities: ["animatable", "editable-colors", "responsive"],
    technical: {
      type: "css-loader",
      codeOnly: true,
      packageVersion: raw.packageJson?.version
    },
    search: {
      text: `${item.title} SpinKit loader spinner CSS animation`,
      keywords: [item.name, "spinkit", "loader", "spinner", "css", "animation"]
    },
    ingestion: {
      extractor: "spinkit",
      extractorVersion: EXTRACTOR_VERSION,
      fetchedAt,
      transformedAt: now(),
      sourceHash: hash(content),
      status: "validated",
      warnings: []
    },
    sourceData: {
      html: item.html
    }
  };
}
