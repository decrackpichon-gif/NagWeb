// Infer only hexadecimal colors used in actual CSS color declarations.
// Operates on the component's own <style> tags, never on arbitrary markup.
const STYLE_BLOCK = /(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi;
const DECLARATION = /([a-z][a-z0-9-]*)\s*:\s*([^;{}]+)(?=;|\})/gi;
const HEX = /#[a-f\d]{6}(?![a-f\d])|#[a-f\d]{3}(?![a-f\d])/gi;
const ACCEPTED_PROPERTY = /^(?:color|background(?:-color|-image)?|border(?:-(?:top|bottom|left|right))?(?:-color)?|outline(?:-color)?|(?:box|text)-shadow|fill|stroke|text-decoration-color|caret-color)$/i;
const MAX_COLORS = 6;

function canonical(token) {
  if (typeof token !== "string") return null;
  if (/^#[a-f\d]{6}$/i.test(token)) return token.toLowerCase();
  if (/^#[a-f\d]{3}$/i.test(token)) {
    return "#" + [...token.slice(1)].map(char => char + char).join("").toLowerCase();
  }
  return null;
}

function styleDeclarations(css, inspect) {
  // Avoid describing values found only in comments.
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const match of clean.matchAll(DECLARATION)) {
    const property = match[1];
    const value = match[2];
    if (ACCEPTED_PROPERTY.test(property) && !/url\s*\(/i.test(value)) {
      inspect(property, value);
    }
  }
}

export function inferUiverseCssColorProps(html) {
  const found = new Set();
  for (const style of String(html || "").matchAll(STYLE_BLOCK)) {
    styleDeclarations(style[2], (_property, value) => {
      for (const token of value.matchAll(HEX)) {
        const color = canonical(token[0]);
        if (color && found.size < MAX_COLORS) found.add(color);
      }
    });
  }
  return [...found].map((color, index) => ({
    id: "uiverseColor" + (index + 1),
    label: "Color original " + (index + 1),
    group: "Colores del componente",
    valueType: "color",
    control: "color",
    defaultValue: color,
    binding: { type: "css-color-token", token: color },
    responsive: true,
    animatable: false
  }));
}

function mainHtml(resource) {
  const artifacts = resource?.artifacts || [];
  const entryId = resource?.runtime?.entryArtifactId;
  return String((artifacts.find(artifact => artifact.id === entryId) ||
    artifacts.find(artifact => artifact.role === "component"))?.content || "");
}

function isUiverseHtml(resource) {
  return resource?.source?.provider === "uiverse" &&
    resource?.runtime?.renderer === "nagweb-html-tailwind";
}

// Existing persisted snapshots gain the palette even before being re-imported.
// Future imports carry the same props in the resource's editableProps metadata.
export function effectiveUiverseEditableProps(resource) {
  const original = resource?.editableProps || [];
  if (!isUiverseHtml(resource)) return original;
  const seen = new Set(original.map(prop => prop.id));
  return [...original, ...inferUiverseCssColorProps(mainHtml(resource))
    .filter(prop => !seen.has(prop.id))];
}

export function isSupportedUiverseCssColor(resource, prop) {
  if (!isUiverseHtml(resource) || !prop ||
      prop.binding?.type !== "css-color-token" || prop.valueType !== "color") return false;
  return inferUiverseCssColorProps(mainHtml(resource)).some(inferred =>
    inferred.id === prop.id &&
    inferred.defaultValue === prop.defaultValue &&
    inferred.binding.token === prop.binding.token);
}

export function applyUiverseCssColorValues(resource, values, html) {
  if (!isUiverseHtml(resource) || typeof html !== "string" || !html) return html || "";
  const replacements = new Map();
  const candidates = inferUiverseCssColorProps(mainHtml(resource));
  for (const prop of candidates) {
    const chosen = Object.hasOwn(values || {}, prop.id) ? values[prop.id] : prop.defaultValue;
    replacements.set(prop.defaultValue, canonical(chosen) || prop.defaultValue);
  }
  if (!replacements.size) return html;
  return html.replace(STYLE_BLOCK, (original, start, body, end) => {
    // Keep selectors, non-color declarations, external URLs and HTML untouched.
    const changed = body.replace(
      /\/\*[\s\S]*?\*\/|([a-z][a-z0-9-]*)\s*:\s*([^;{}]+)(?=;|\})/gi,
      (full, property, value) => {
      if (!property || !ACCEPTED_PROPERTY.test(property) ||
          /url\s*\(/i.test(value)) return full;
      const next = value.replace(HEX, token => replacements.get(canonical(token)) || token);
      return full.replace(value, next);
    });
    return start + changed + end;
  });
}
