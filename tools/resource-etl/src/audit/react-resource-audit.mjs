import { fetchJson } from "../lib/http.mjs";

const SAFE_VIRTUAL_IMPORTS = new Set([
  "@/lib/utils"
]);

const PERMISSIVE_LICENSE_TOKENS = new Set([
  "MIT",
  "ISC",
  "0BSD",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "Apache-2.0",
  "CC0-1.0",
  "Unlicense"
]);

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function collectModuleSpecifiers(code) {
  const source = String(code || "");
  const found = [];

  const patterns = [
    /\bimport\s+(?:type\s+)?(?:[^"'()]*?\s+from\s+)?["']([^"']+)["']/g,
    /\bexport\s+(?:type\s+)?[^"'()]*?\s+from\s+["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) found.push(match[1]);
  }

  return unique(found);
}

export function npmPackageRoot(specifier) {
  const value = String(specifier || "");
  if (!value || value.startsWith(".") || value.startsWith("/") || value.startsWith("@/")) {
    return null;
  }
  if (/^(?:https?:|data:|blob:|node:)/i.test(value)) return null;

  if (value.startsWith("@")) {
    const [scope, name] = value.split("/");
    return scope && name ? `${scope}/${name}` : value;
  }

  return value.split("/")[0];
}

function isLocalRelative(specifier) {
  return specifier.startsWith("./") || specifier.startsWith("../");
}

function isRemoteSpecifier(specifier) {
  return /^(?:https?:|data:|blob:)/i.test(specifier);
}

function isNodeBuiltin(specifier) {
  return specifier.startsWith("node:");
}

function normalizeArtifactPath(value) {
  return String(value || "")
    .replaceAll("\\", "/")
    .replace(/^\.\//, "")
    .replace(/^src\//, "")
    .replace(/^components\//, "");
}

function stripExtension(value) {
  return value.replace(/\.(?:[cm]?[jt]sx?|json)$/i, "");
}

function relativeImportResolvable(fromPath, specifier, artifactPaths) {
  const base = normalizeArtifactPath(fromPath);
  const parts = base.split("/");
  parts.pop();

  for (const token of specifier.split("/")) {
    if (!token || token === ".") continue;
    if (token === "..") parts.pop();
    else parts.push(token);
  }

  const candidate = stripExtension(parts.join("/"));
  return artifactPaths.some((path) => {
    const normalized = stripExtension(normalizeArtifactPath(path));
    return normalized === candidate || normalized === `${candidate}/index`;
  });
}

export function scanBrowserSource(code) {
  const source = String(code || "");
  const checks = [
    ["network-fetch", /\bfetch\s*\(/],
    ["network-xhr", /\bXMLHttpRequest\b/],
    ["network-websocket", /\bWebSocket\s*\(/],
    ["network-eventsource", /\bEventSource\s*\(/],
    ["network-beacon", /\bsendBeacon\s*\(/],
    ["dynamic-code-eval", /\beval\s*\(/],
    ["dynamic-code-function", /\bnew\s+Function\s*\(/],
    ["browser-cookie", /\bdocument\.cookie\b/],
    ["browser-local-storage", /\blocalStorage\b/],
    ["browser-session-storage", /\bsessionStorage\b/],
    ["browser-indexeddb", /\bindexedDB\b/],
    ["browser-window-open", /\bwindow\.open\s*\(/],
    ["browser-iframe", /<iframe\b/i],
    ["dangerous-html", /dangerouslySetInnerHTML\s*=/],
    ["script-injection", /createElement\s*\(\s*["']script["']\s*\)/i]
  ];

  return checks
    .filter(([, pattern]) => pattern.test(source))
    .map(([id]) => id);
}

export function inferExportedComponent(code) {
  const source = String(code || "");
  const candidates = [
    ...source.matchAll(/export\s+(?:async\s+)?function\s+([A-Z][A-Za-z0-9_$]*)\b/g),
    ...source.matchAll(/export\s+const\s+([A-Z][A-Za-z0-9_$]*)\b/g),
    ...source.matchAll(/export\s+class\s+([A-Z][A-Za-z0-9_$]*)\b/g)
  ];

  if (candidates.length) return { name: candidates[0][1], isDefault: false };

  const defaultNamed = source.match(
    /export\s+default\s+(?:function|class)\s+([A-Z][A-Za-z0-9_$]*)\b/
  );
  if (defaultNamed) return { name: defaultNamed[1], isDefault: true };

  if (/export\s+default\s+/m.test(source)) {
    return { name: "default", isDefault: true };
  }

  return null;
}

export function inferRequiredProps(code) {
  const source = String(code || "");
  const required = [];

  for (const block of source.matchAll(
    /(?:interface|type)\s+[A-Za-z_$][\w$]*Props\s*(?:=)?\s*\{([\s\S]*?)\n\}/g
  )) {
    for (const line of block[1].split("\n")) {
      const match = line.match(/^\s*([A-Za-z_$][\w$]*)\s*:\s*([^;]+);?\s*$/);
      if (!match) continue;
      const name = match[1];
      if (["children", "className", "style"].includes(name)) continue;
      required.push(name);
    }
  }

  return unique(required);
}

export function auditReactResourceStatic(resource) {
  const componentArtifacts = (resource.artifacts || []).filter(
    (artifact) => artifact.role === "component" && typeof artifact.content === "string"
  );

  const artifactPaths = componentArtifacts.map(
    (artifact) => artifact.targetPath || artifact.sourcePath || artifact.id
  );

  const imports = [];
  const securityFindings = [];
  const unresolvedRelativeImports = [];

  for (const artifact of componentArtifacts) {
    const code = artifact.content || "";
    const sourcePath = artifact.targetPath || artifact.sourcePath || artifact.id;
    imports.push(...collectModuleSpecifiers(code));
    securityFindings.push(...scanBrowserSource(code));

    for (const specifier of collectModuleSpecifiers(code)) {
      if (
        isLocalRelative(specifier) &&
        !relativeImportResolvable(sourcePath, specifier, artifactPaths)
      ) {
        unresolvedRelativeImports.push({
          from: sourcePath,
          specifier
        });
      }
    }
  }

  const uniqueImports = unique(imports);
  const remoteImports = uniqueImports.filter(isRemoteSpecifier);
  const nodeBuiltins = uniqueImports.filter(isNodeBuiltin);
  const aliases = uniqueImports.filter((value) => value.startsWith("@/"));
  const unsupportedAliases = aliases.filter(
    (value) => !SAFE_VIRTUAL_IMPORTS.has(value)
  );
  const npmPackages = unique(
    uniqueImports.map(npmPackageRoot)
  );

  const entryArtifact = componentArtifacts[0] || null;
  const entryCode = entryArtifact?.content || "";
  const exportedComponent = inferExportedComponent(entryCode);
  const requiredProps = inferRequiredProps(entryCode);

  const blockers = [];

  if (!componentArtifacts.length) blockers.push("no-component-source");
  if (!exportedComponent) blockers.push("no-exported-component");
  if (remoteImports.length) blockers.push("remote-imports");
  if (nodeBuiltins.length) blockers.push("node-builtins");
  if (unsupportedAliases.length) blockers.push("unsupported-aliases");
  if (unresolvedRelativeImports.length) blockers.push("unresolved-relative-imports");
  if (securityFindings.length) blockers.push("security-findings");
  if ((resource.runtime?.registryDependencies || []).length) {
    blockers.push("registry-dependencies");
  }
  if (requiredProps.length) blockers.push("required-props");

  return {
    resourceId: resource.id,
    eligibleForBundle: blockers.length === 0,
    blockers: unique(blockers),
    imports: uniqueImports,
    npmPackages,
    aliases,
    unsupportedAliases,
    unresolvedRelativeImports,
    remoteImports,
    nodeBuiltins,
    securityFindings: unique(securityFindings),
    requiredProps,
    exportedComponent,
    virtualImports: aliases.filter((value) => SAFE_VIRTUAL_IMPORTS.has(value))
  };
}

function normalizeLicenseExpression(value) {
  return String(value || "")
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isPermissiveLicenseExpression(value) {
  const expression = normalizeLicenseExpression(value);
  if (!expression) return false;

  const tokens = expression
    .split(/\s+(?:OR|AND)\s+/i)
    .map((item) => item.trim())
    .filter(Boolean);

  return tokens.length > 0 && tokens.every((token) => PERMISSIVE_LICENSE_TOKENS.has(token));
}

const npmLicenseCache = new Map();

export async function fetchNpmLicense(packageName) {
  if (npmLicenseCache.has(packageName)) {
    return npmLicenseCache.get(packageName);
  }
  const encoded = encodeURIComponent(packageName);
  const metadata = await fetchJson(
    `https://registry.npmjs.org/${encoded}/latest`,
    { retries: 2, timeoutMs: 15000 }
  );

  const result = {
    package: packageName,
    version: metadata.version || null,
    license:
      typeof metadata.license === "string"
        ? metadata.license
        : metadata.license?.type || null,
    repository:
      typeof metadata.repository === "string"
        ? metadata.repository
        : metadata.repository?.url || null
  };

  npmLicenseCache.set(packageName, result);
  return result;
}

export async function auditNpmPackages(packageNames) {
  const results = [];

  for (const packageName of unique(packageNames)) {
    try {
      const metadata = await fetchNpmLicense(packageName);
      results.push({
        ...metadata,
        permitted: isPermissiveLicenseExpression(metadata.license),
        error: null
      });
    } catch (error) {
      results.push({
        package: packageName,
        version: null,
        license: null,
        repository: null,
        permitted: false,
        error: error?.message || String(error)
      });
    }
  }

  return {
    packages: results,
    allPermitted: results.every((item) => item.permitted)
  };
}

export async function auditReactResourceWithLicenses(resource) {
  const staticAudit = auditReactResourceStatic(resource);
  const npmAudit = await auditNpmPackages(staticAudit.npmPackages);

  const blockers = [...staticAudit.blockers];
  if (!npmAudit.allPermitted) blockers.push("npm-license");

  return {
    ...staticAudit,
    eligibleForBundle: blockers.length === 0,
    blockers: unique(blockers),
    npmAudit
  };
}
