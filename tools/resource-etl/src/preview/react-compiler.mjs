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
  "react-use-measure"
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

function artifactMap(resource) {
  const map = new Map();

  for (const artifact of resource.artifacts || []) {
    if (artifact.role !== "component" || typeof artifact.content !== "string") continue;
    const artifactPath = normalizePath(
      artifact.targetPath || artifact.sourcePath || artifact.id
    );
    map.set(artifactPath, artifact.content);
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

export async function compileReactResource(resource) {
  const staticAudit = auditReactResourceStatic(resource);
  if (!staticAudit.eligibleForBundle) {
    return {
      ok: false,
      reason: staticAudit.blockers.join(","),
      audit: staticAudit
    };
  }

  const licenseAudit = await auditReactResourceWithLicenses(resource);
  if (!licenseAudit.eligibleForBundle) {
    return {
      ok: false,
      reason: licenseAudit.blockers.join(","),
      audit: licenseAudit
    };
  }

  const unsupportedRuntimePackages = licenseAudit.npmPackages.filter(
    (packageName) => !REACT_PREVIEW_RUNTIME_PACKAGES.has(packageName)
  );
  if (unsupportedRuntimePackages.length) {
    return {
      ok: false,
      reason: `unsupported-runtime-packages:${unsupportedRuntimePackages.join(",")}`,
      audit: licenseAudit
    };
  }

  const missingPackages = licenseAudit.npmPackages.filter(
    (packageName) => !packageInstalled(packageName)
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

  const files = artifactMap(resource);
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

  const importLine = exported?.isDefault
    ? 'import Component from "nagweb-entry-component";'
    : `import { ${exported.name} as Component } from "nagweb-entry-component";`;

  const harness = `
import React from "react";
import { createRoot } from "react-dom/client";
${importLine}

const props = ${JSON.stringify(props)};
const children = Object.prototype.hasOwnProperty.call(props, "children")
  ? props.children
  : undefined;
if (Object.prototype.hasOwnProperty.call(props, "children")) delete props.children;

function App() {
  return React.createElement(
    "div",
    { id: "nagweb-preview-stage" },
    React.createElement(Component, props, children)
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
        { filter: /^[^./@]|^@(?!\/)/, namespace: "nagweb-resource" },
        async (args) => {
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

export async function buildReactVaultPreviews(rootDir, catalog, { max = Infinity } = {}) {
  const previewsDir = path.join(rootDir, "previews");
  const reactDir = path.join(previewsDir, "react");
  await mkdir(reactDir, { recursive: true });

  const runtime = await ensurePreviewRuntime(previewsDir);

  let ready = 0;
  let deferred = 0;
  const audits = [];

  for (const entry of catalog.resources || []) {
    if (ready + deferred >= max) break;
    if (entry.kind !== "react-component" || !entry.vaultPath) continue;

    const resource = await readJson(path.join(rootDir, entry.vaultPath));
    const result = await compileReactResource(resource);

    audits.push({
      resourceId: resource.id,
      ok: result.ok,
      reason: result.ok ? null : result.reason,
      audit: result.audit
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
      npmLicenses: result.audit.npmAudit?.packages || []
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
