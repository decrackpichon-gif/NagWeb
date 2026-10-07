import { buildReactPreviewRecipe } from "./recipes.mjs";
import path from "node:path";
import { createRequire } from "node:module";
import {
  copyFile,
  mkdir,
  readFile,
  writeFile
} from "node:fs/promises";
import {
  auditReactResourceStatic,
  auditReactResourceWithLicenses,
  npmPackageRoot
} from "../audit/react-resource-audit.mjs";
import { createResourceInstance } from "../runtime/instance.mjs";

const require = createRequire(import.meta.url);

export const REACT_PREVIEW_RUNTIME_PACKAGES = new Set([
  "react",
  "react-dom",
  "motion",
  "framer-motion",
  "react-use-measure",
  "radix-ui",
  "lucide-react",
  "class-variance-authority"
]);

export const REACT_PREVIEW_VIRTUAL_PACKAGES = new Set([
  "next-themes",
  "cn"
]);

function normalizePath(value) {
  return String(value || "")
    .replaceAll("\\", "/")
    .replace(/^\.\//, "");
}

function withoutExtension(value) {
  return value.replace(/\.(?:[cm]?[jt]sx?|json)$/i, "");
}

function loaderFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".tsx") return "tsx";
  if (ext === ".ts") return "ts";
  if (ext === ".jsx") return "jsx";
  if (ext === ".json") return "json";
  return "js";
}

function flattenClassValue(value, output) {
  if (!value) return;
  if (typeof value === "string" || typeof value === "number") {
    output.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) flattenClassValue(item, output);
    return;
  }
  if (typeof value === "object") {
    for (const [key, enabled] of Object.entries(value)) {
      if (enabled) output.push(key);
    }
  }
}

const virtualNextThemes = `
export function useTheme() {
  return {
    theme: "light",
    systemTheme: "light",
    resolvedTheme: "light",
    themes: ["light", "dark", "system"],
    setTheme() {}
  };
}
export function ThemeProvider({ children }) {
  return children ?? null;
}
`;

const virtualUtils = `
export function cn(...inputs) {
  const output = [];
  const flatten = (value) => {
    if (!value) return;
    if (typeof value === "string" || typeof value === "number") {
      output.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) flatten(item);
      return;
    }
    if (typeof value === "object") {
      for (const [key, enabled] of Object.entries(value)) {
        if (enabled) output.push(key);
      }
    }
  };
  for (const input of inputs) flatten(input);
  return output.join(" ");
}
`;

function artifactMap(resources) {
  const map = new Map();

  for (const resource of resources) {
    for (const artifact of resource.artifacts || []) {
    if (artifact.role !== "component" || typeof artifact.content !== "string") continue;
    const artifactPath = normalizePath(
      artifact.targetPath || artifact.sourcePath || artifact.id
    );
      map.set(artifactPath, artifact.content);
    }
  }

  return map;
}

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

function aliasCandidatesForRegistryResource(resource) {
  const aliases = new Set();
  const name = resource.name || registryDependencyName(resource.id);

  if (name) {
    aliases.add(`@/components/ui/${name}`);
    aliases.add(`@/registry/new-york-v4/ui/${name}`);
    aliases.add(`@/components/magicui/${name}`);
    aliases.add(`@/registry/magicui/${name}`);
  }

  for (const artifact of resource.artifacts || []) {
    if (artifact.role !== "component") continue;
    const values = [artifact.targetPath, artifact.sourcePath].filter(Boolean);

    for (const value of values) {
      const normalized = normalizePath(value).replace(/\.(?:[cm]?[jt]sx?)$/i, "");

      const componentIndex = normalized.indexOf("components/");
      if (componentIndex >= 0) {
        aliases.add(`@/${normalized.slice(componentIndex)}`);
      }

      const registryIndex = normalized.indexOf("registry/");
      if (registryIndex >= 0) {
        aliases.add(`@/${normalized.slice(registryIndex)}`);
      }
    }
  }

  return [...aliases];
}

function buildRegistryAliasMap(registryResources) {
  const map = new Map();

  for (const resource of registryResources) {
    const artifact = (resource.artifacts || []).find(
      (item) => item.role === "component" && typeof item.content === "string"
    );
    if (!artifact) continue;

    const artifactPath = normalizePath(
      artifact.targetPath || artifact.sourcePath || artifact.id
    );

    for (const alias of aliasCandidatesForRegistryResource(resource)) {
      map.set(alias, artifactPath);
    }
  }

  return map;
}

function resolveVirtualRelative(importer, specifier, files) {
  const importerParts = normalizePath(importer).split("/");
  importerParts.pop();

  for (const part of specifier.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") importerParts.pop();
    else importerParts.push(part);
  }

  const base = normalizePath(importerParts.join("/"));
  const candidates = [
    base,
    `${base}.tsx`,
    `${base}.ts`,
    `${base}.jsx`,
    `${base}.js`,
    `${base}/index.tsx`,
    `${base}/index.ts`,
    `${base}/index.jsx`,
    `${base}/index.js`
  ];

  return candidates.find((candidate) => files.has(candidate)) || null;
}

function packageInstalled(packageName) {
  try {
    require.resolve(`${packageName}/package.json`);
    return true;
  } catch {
    try {
      require.resolve(packageName);
      return true;
    } catch {
      return false;
    }
  }
}

function defaultPreviewProps(resource, entryCode) {
  const instance = createResourceInstance(resource, {
    instanceId: "preview"
  });

  const props = {};
  for (const [key, value] of Object.entries(instance.values || {})) {
    if (value !== null && value !== undefined) props[key] = value;
  }

  if (/\bchildren\??\s*:/.test(entryCode) && props.children == null) {
    props.children = resource.title || "NagWeb Preview";
  }

  return props;
}

function cssPropertyName(value) {
  return String(value).replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

function registryCssToText(resource) {
  const setupCss = resource.runtime?.setup?.css || {};
  const cssVariables = resource.runtime?.cssVariables || {};
  const blocks = [];

  const variableEntries = Object.entries(cssVariables);
  if (variableEntries.length) {
    blocks.push("@theme {");
    for (const [key, value] of variableEntries) {
      const variable = key.startsWith("--") ? key : `--${key}`;
      blocks.push(`  ${variable}: ${value};`);
    }
    blocks.push("}");
  }

  for (const [selector, rules] of Object.entries(setupCss)) {
    blocks.push(`${selector} {`);
    for (const [frame, properties] of Object.entries(rules || {})) {
      blocks.push(`  ${frame} {`);
      for (const [property, value] of Object.entries(properties || {})) {
        blocks.push(`    ${cssPropertyName(property)}: ${value};`);
      }
      blocks.push("  }");
    }
    blocks.push("}");
  }

  return blocks.join("\n");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function previewHtml({ title, bundleFile, tailwindFile, registryCss }) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'self'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; media-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
<title>${escapeHtml(title)}</title>
<style type="text/tailwindcss">
@theme {
  --color-background: #ffffff;
  --color-foreground: #171717;
}
${registryCss}
</style>
<style>
html,body,#root{min-height:100%;margin:0}
body{font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#f4f4f5;color:#18181b}
#root{display:grid;place-items:center;padding:32px;box-sizing:border-box}
#nagweb-preview-stage{position:relative;width:min(720px,90vw);min-height:320px;display:grid;place-items:center;overflow:hidden;border:1px solid #e4e4e7;border-radius:24px;background:white;box-shadow:0 24px 80px rgba(0,0,0,.12);padding:32px;box-sizing:border-box}
</style>
<script src="${tailwindFile}"></script>
</head>
<body>
<div id="root"></div>
<script src="${bundleFile}"></script>
</body>
</html>`;
}

async function ensurePreviewRuntime(previewsDir) {
  const runtimeDir = path.join(previewsDir, "runtime");
  await mkdir(runtimeDir, { recursive: true });

  const target = path.join(runtimeDir, "tailwindcss-browser.js");
  const source = require.resolve("@tailwindcss/browser");
  await copyFile(source, target);

  return {
    runtimeDir,
    tailwindRelativeFromReact: "../runtime/tailwindcss-browser.js"
  };
}

export async function compileReactResource(
  resource,
  { registryResources = [], resolvedRegistryDependencies = [] } = {}
) {
  const allResources = [resource, ...registryResources];
  const registryAliasMap = buildRegistryAliasMap(registryResources);
  const auditResource = {
    ...resource,
    artifacts: allResources.flatMap((item) => item.artifacts || [])
  };
  const auditOptions = {
    resolvedAliases: [...registryAliasMap.keys()],
    resolvedRegistryDependencies
  };

  const staticAudit = auditReactResourceStatic(auditResource, auditOptions);
  if (!staticAudit.eligibleForBundle) {
    return {
      ok: false,
      reason: staticAudit.blockers.join(","),
      audit: staticAudit
    };
  }

  const licenseAudit = await auditReactResourceWithLicenses(
    auditResource,
    auditOptions
  );
  if (!licenseAudit.eligibleForBundle) {
    return {
      ok: false,
      reason: licenseAudit.blockers.join(","),
      audit: licenseAudit
    };
  }

  const unsupportedRuntimePackages = licenseAudit.npmPackages.filter(
    (packageName) =>
      !REACT_PREVIEW_RUNTIME_PACKAGES.has(packageName) &&
      !REACT_PREVIEW_VIRTUAL_PACKAGES.has(packageName)
  );
  if (unsupportedRuntimePackages.length) {
    return {
      ok: false,
      reason: `unsupported-runtime-packages:${unsupportedRuntimePackages.join(",")}`,
      audit: licenseAudit
    };
  }

  const missingPackages = licenseAudit.npmPackages.filter(
    (packageName) =>
      !REACT_PREVIEW_VIRTUAL_PACKAGES.has(packageName) &&
      !packageInstalled(packageName)
  );
  if (missingPackages.length) {
    return {
      ok: false,
      reason: `npm-package-not-installed:${missingPackages.join(",")}`,
      audit: licenseAudit
    };
  }

  if (!packageInstalled("react-dom") || !packageInstalled("react")) {
    return {
      ok: false,
      reason: "react-preview-runtime-not-installed",
      audit: licenseAudit
    };
  }

  let esbuild;
  try {
    esbuild = await import("esbuild");
  } catch {
    return {
      ok: false,
      reason: "esbuild-not-installed",
      audit: licenseAudit
    };
  }

  const files = artifactMap(allResources);
  const entryArtifact = (resource.artifacts || []).find(
    (artifact) => artifact.role === "component" && typeof artifact.content === "string"
  );
  if (!entryArtifact) {
    return { ok: false, reason: "no-entry-artifact", audit: licenseAudit };
  }

  const entryPath = normalizePath(
    entryArtifact.targetPath || entryArtifact.sourcePath || entryArtifact.id
  );
  const entryCode = entryArtifact.content || "";
  const exported = licenseAudit.exportedComponent;
  const props = defaultPreviewProps(resource, entryCode);

  const recipe = buildReactPreviewRecipe(resource, {
    primaryExport: exported?.name,
    defaultProps: props
  });

  const harness = `
import React from "react";
import { createRoot } from "react-dom/client";
import * as ResourceModule from "nagweb-entry-component";

const recipe = ${JSON.stringify(recipe).replaceAll("<", "\\u003c")};

function renderRecipe(node, key) {
  if (node === null || node === undefined || node === false) return null;
  if (typeof node === "string" || typeof node === "number") return node;

  const children = (node.children || []).map((child, index) =>
    renderRecipe(child, index)
  );

  if (node.kind === "element") {
    return React.createElement(
      node.tag || "div",
      { ...(node.props || {}), key },
      ...children
    );
  }

  const Component = ResourceModule[node.name];
  if (!Component) {
    return React.createElement(
      "div",
      {
        key,
        style: {
          padding: "12px",
          border: "1px solid #ef4444",
          borderRadius: "10px",
          color: "#991b1b",
          background: "#fef2f2",
          fontFamily: "system-ui"
        }
      },
      "Preview recipe references missing export: " + node.name
    );
  }

  return React.createElement(
    Component,
    { ...(node.props || {}), key },
    ...children
  );
}

function App() {
  return React.createElement(
    "div",
    { id: "nagweb-preview-stage" },
    renderRecipe(recipe, "preview-root")
  );
}

const root = createRoot(document.getElementById("root"));
root.render(React.createElement(App));
`;

  const plugin = {
    name: "nagweb-resource-vfs",
    setup(build) {
      build.onResolve({ filter: /^nagweb-entry-component$/ }, () => ({
        path: entryPath,
        namespace: "nagweb-resource"
      }));

      build.onResolve({ filter: /^@\/lib\/utils$/ }, () => ({
        path: "nagweb-utils",
        namespace: "nagweb-virtual"
      }));

      build.onResolve({ filter: /^cn$/ }, () => ({
        path: "nagweb-utils",
        namespace: "nagweb-virtual"
      }));

      build.onResolve({ filter: /^next-themes$/ }, () => ({
        path: "nagweb-next-themes",
        namespace: "nagweb-virtual"
      }));

      build.onResolve(
        { filter: /^@\//, namespace: "nagweb-resource" },
        (args) => {
          const resolved = registryAliasMap.get(args.path);
          if (!resolved) return;
          return {
            path: resolved,
            namespace: "nagweb-resource"
          };
        }
      );

      build.onResolve(
        { filter: /^\.\.?\//, namespace: "nagweb-resource" },
        (args) => {
          const resolved = resolveVirtualRelative(args.importer, args.path, files);
          if (!resolved) {
            return {
              errors: [{
                text: `Unresolved resource import ${args.path} from ${args.importer}`
              }]
            };
          }
          return { path: resolved, namespace: "nagweb-resource" };
        }
      );

      build.onResolve(
        { filter: /^[^./]/, namespace: "nagweb-resource" },
        async (args) => {
          if (args.path.startsWith("@/")) {
            return {
              errors: [{
                text: `Unresolved Vault alias ${args.path}`
              }]
            };
          }

          const packageName = npmPackageRoot(args.path);
          if (packageName && !REACT_PREVIEW_RUNTIME_PACKAGES.has(packageName)) {
            return {
              errors: [{
                text: `Package ${packageName} is not allowed in the React preview runtime`
              }]
            };
          }

          try {
            return {
              path: require.resolve(args.path),
              namespace: "file"
            };
          } catch (error) {
            return {
              errors: [{
                text: `Unable to resolve installed package import ${args.path}: ${error?.message || error}`
              }]
            };
          }
        }
      );

      build.onLoad(
        { filter: /.*/, namespace: "nagweb-resource" },
        (args) => ({
          contents: files.get(args.path),
          loader: loaderFor(args.path),
          resolveDir: process.cwd()
        })
      );

      build.onLoad(
        { filter: /^nagweb-utils$/, namespace: "nagweb-virtual" },
        () => ({
          contents: virtualUtils,
          loader: "js"
        })
      );

      build.onLoad(
        { filter: /^nagweb-next-themes$/, namespace: "nagweb-virtual" },
        () => ({
          contents: virtualNextThemes,
          loader: "jsx"
        })
      );
    }
  };

  try {
    const result = await esbuild.build({
      stdin: {
        contents: harness,
        loader: "jsx",
        sourcefile: "nagweb-preview-entry.jsx",
        resolveDir: process.cwd()
      },
      bundle: true,
      platform: "browser",
      format: "iife",
      target: ["es2020"],
      jsx: "automatic",
      write: false,
      sourcemap: false,
      minify: false,
      logLevel: "silent",
      plugins: [plugin],
      define: {
        "process.env.NODE_ENV": '"production"'
      }
    });

    const bundle = result.outputFiles?.[0]?.text || "";
    if (!bundle) throw new Error("esbuild returned no JavaScript output");

    return {
      ok: true,
      bundle,
      audit: licenseAudit,
      props,
      registryCss: registryCssToText(resource)
    };
  } catch (error) {
    return {
      ok: false,
      reason: `compile-error:${error?.message || String(error)}`,
      audit: licenseAudit
    };
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function inferRegistryAliasDependencies(resource) {
  const dependencies = new Set();

  for (const artifact of resource.artifacts || []) {
    if (artifact.role !== "component" || typeof artifact.content !== "string") continue;

    for (const match of artifact.content.matchAll(
      /from\s+["']@\/(?:registry\/[^/]+\/ui|components\/ui)\/([^/"']+)["']/g
    )) {
      if (match[1]) dependencies.add(match[1]);
    }
  }

  return [...dependencies];
}

function allLocalRegistryDependencies(resource) {
  return [
    ...new Set([
      ...(resource.runtime?.registryDependencies || []),
      ...inferRegistryAliasDependencies(resource)
    ])
  ];
}

function catalogDependencyCandidates(catalog, ownerResource, dependency) {
  const name = registryDependencyName(dependency);
  const ownerProvider = ownerResource.source?.provider;

  return (catalog.resources || [])
    .filter((entry) => entry.vaultPath && entry.kind === "react-component")
    .sort((a, b) => {
      const score = (entry) => {
        if (entry.id === `${ownerProvider}:${name}`) return 0;
        if (entry.id === `shadcn:${name}`) return 1;
        if (entry.id === `magicui:${name}`) return 2;
        if (entry.name === name) return 3;
        return 10;
      };
      return score(a) - score(b);
    })
    .filter((entry) => {
      const entryName = entry.name || registryDependencyName(entry.id);
      return entryName === name || entry.id.endsWith(`:${name}`);
    });
}

async function resolveRegistryResources(rootDir, catalog, resource, cache) {
  const resolved = [];
  const resolvedDependencies = [];
  const missing = [];
  const visited = new Set([resource.id]);

  async function loadEntry(entry) {
    if (cache.has(entry.id)) return cache.get(entry.id);
    const loaded = await readJson(path.join(rootDir, entry.vaultPath));
    cache.set(entry.id, loaded);
    return loaded;
  }

  async function visit(owner, dependency) {
    const candidates = catalogDependencyCandidates(catalog, owner, dependency);
    const entry = candidates[0];

    if (!entry) {
      missing.push({ owner: owner.id, dependency });
      return;
    }

    const dependencyResource = await loadEntry(entry);

    if (
      !dependencyResource.license?.verified ||
      dependencyResource.license?.redistributionAllowed === false
    ) {
      missing.push({
        owner: owner.id,
        dependency,
        reason: "dependency-license-not-approved"
      });
      return;
    }

    resolvedDependencies.push(dependency);
    if (visited.has(dependencyResource.id)) return;
    visited.add(dependencyResource.id);
    resolved.push(dependencyResource);

    for (const nested of allLocalRegistryDependencies(dependencyResource)) {
      await visit(dependencyResource, nested);
    }
  }

  for (const dependency of allLocalRegistryDependencies(resource)) {
    await visit(resource, dependency);
  }

  return {
    resources: resolved,
    resolvedDependencies,
    missing
  };
}

export async function buildReactVaultPreviews(rootDir, catalog, { max = Infinity } = {}) {
  const previewsDir = path.join(rootDir, "previews");
  const reactDir = path.join(previewsDir, "react");
  await mkdir(reactDir, { recursive: true });

  const runtime = await ensurePreviewRuntime(previewsDir);

  let ready = 0;
  let deferred = 0;
  const audits = [];
  const resourceCache = new Map();

  for (const entry of catalog.resources || []) {
    if (ready + deferred >= max) break;
    if (entry.kind !== "react-component" || !entry.vaultPath) continue;

    const resource = await readJson(path.join(rootDir, entry.vaultPath));
    resourceCache.set(resource.id, resource);

    const registryResolution = await resolveRegistryResources(
      rootDir,
      catalog,
      resource,
      resourceCache
    );

    const result = registryResolution.missing.length
      ? {
          ok: false,
          reason: `missing-registry-dependencies:${registryResolution.missing
            .map((item) => item.dependency)
            .join(",")}`,
          audit: auditReactResourceStatic(resource)
        }
      : await compileReactResource(resource, {
          registryResources: registryResolution.resources,
          resolvedRegistryDependencies: registryResolution.resolvedDependencies
        });

    audits.push({
      resourceId: resource.id,
      ok: result.ok,
      reason: result.ok ? null : result.reason,
      audit: result.audit,
      registryResources: registryResolution.resources.map((item) => item.id),
      registryMissing: registryResolution.missing
    });

    if (!result.ok) {
      entry.previewStatus = "deferred";
      entry.previewReason = result.reason;
      console.log(`[react-preview] deferred ${resource.id}: ${result.reason}`);
      deferred += 1;
      continue;
    }

    const base = resource.id.replace(/[^a-z0-9._-]+/gi, "__");
    const jsName = `${base}.js`;
    const htmlName = `${base}.html`;

    await writeFile(path.join(reactDir, jsName), result.bundle, "utf8");
    await writeFile(
      path.join(reactDir, htmlName),
      previewHtml({
        title: resource.title,
        bundleFile: `./${jsName}`,
        tailwindFile: runtime.tailwindRelativeFromReact,
        registryCss: result.registryCss
      }),
      "utf8"
    );

    console.log(`[react-preview] ready ${resource.id}`);
    entry.previewStatus = "ready-react";
    entry.previewPath = `previews/react/${htmlName}`;
    entry.previewAudit = {
      npmPackages: result.audit.npmPackages,
      npmLicenses: result.audit.npmAudit?.packages || [],
      registryResources: registryResolution.resources.map((item) => item.id)
    };
    ready += 1;
  }

  await writeFile(
    path.join(rootDir, "react-preview-audit.json"),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      ready,
      deferred,
      items: audits
    }, null, 2) + "\n",
    "utf8"
  );

  await writeFile(
    path.join(rootDir, "catalog.json"),
    JSON.stringify(catalog, null, 2) + "\n",
    "utf8"
  );

  return { ready, deferred };
}
