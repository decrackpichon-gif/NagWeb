import { inferUiverseCssDimensionProps } from "./uiverse-dimensions.mjs";
import { inferUiverseCssSpacingProps } from "./uiverse-spacing.mjs";
import { inferUiverseCssTypeBorderProps } from "./uiverse-type-borders.mjs";
import { inferUiverseCssTimingProps } from "./uiverse-timing.mjs";
import { inferUiverseCssMultiTimingProps } from "./uiverse-multi-timing.mjs";
import { inferUiverseCssBezierProps } from "./uiverse-bezier.mjs";
import { inferUiverseCssEasingProps } from "./uiverse-easing.mjs";
import { inferUiverseCssPlaybackProps } from "./uiverse-playback.mjs";
import { inferUiverseTextProps } from "./uiverse-text.mjs";

// Infer hexadecimal, rgb() and rgba() colors from real CSS declarations.
// Operates on the component's own <style> tags, never on arbitrary markup.
const STYLE_BLOCK = /(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi;
const DECLARATION = /([a-z][a-z0-9-]*)\s*:\s*([^;{}]+)(?=;|\})/gi;
const COLOR_TOKEN = /#[a-f\d]{6}(?![a-f\d])|#[a-f\d]{3}(?![a-f\d])|\brgba?\([^()]*\)/gi;
const COMMA_RGB = /^(rgba?)\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d+(?:\.\d+)?|\.\d+))?\s*\)$/i;
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

function rgbComponents(token) {
  const match = typeof token === "string" ? COMMA_RGB.exec(token) : null;
  if (!match) return null;
  const hasAlpha = match[5] !== undefined;
  if ((match[1].toLowerCase() === "rgba") !== hasAlpha) return null;
  const channels = match.slice(2, 5).map(Number);
  if (!channels.every(channel => Number.isInteger(channel) && channel >= 0 &&
    channel <= 255)) return null;
  if (hasAlpha && !(Number(match[5]) >= 0 && Number(match[5]) <= 1)) return null;
  const color = "#" + channels.map(n => n.toString(16).padStart(2, "0")).join("");
  return { color, channels, alpha: hasAlpha ? match[5] : null };
}

function colorFromCssToken(token) {
  return canonical(token) || rgbComponents(token)?.color || null;
}

function substituteCssColorToken(token, hex) {
  const rgb = rgbComponents(token);
  if (!rgb) return canonical(token) ? hex : token;
  const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
  return rgb.alpha === null
    ? "rgb(" + channels.join(", ") + ")"
    : "rgba(" + channels.join(", ") + ", " + rgb.alpha + ")";
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
      for (const token of value.matchAll(COLOR_TOKEN)) {
        const color = colorFromCssToken(token[0]);
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
  return [...original, ...[
    ...inferUiverseCssColorProps(mainHtml(resource)),
    ...inferUiverseCssDimensionProps(mainHtml(resource)),
    ...inferUiverseCssSpacingProps(mainHtml(resource)),
    ...inferUiverseCssTypeBorderProps(mainHtml(resource)),
    ...inferUiverseCssTimingProps(mainHtml(resource)),
    ...inferUiverseCssMultiTimingProps(mainHtml(resource)),
    ...inferUiverseCssBezierProps(mainHtml(resource)),
    ...inferUiverseCssEasingProps(mainHtml(resource)),
    ...inferUiverseCssPlaybackProps(mainHtml(resource)),
    ...inferUiverseTextProps(mainHtml(resource))
  ].filter(prop => !seen.has(prop.id))];
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
    const nextColor = canonical(chosen);
    // Default, unchanged and invalid inputs must preserve the source bytes.
    if (nextColor && nextColor !== prop.defaultValue) {
      replacements.set(prop.defaultValue, nextColor);
    }
  }
  if (!replacements.size) return html;
  return html.replace(STYLE_BLOCK, (original, start, body, end) => {
    // Keep selectors, non-color declarations, external URLs and HTML untouched.
    const changed = body.replace(
      /\/\*[\s\S]*?\*\/|([a-z][a-z0-9-]*)\s*:\s*([^;{}]+)(?=;|\})/gi,
      (full, property, value) => {
      if (!property || !ACCEPTED_PROPERTY.test(property) ||
          /url\s*\(/i.test(value)) return full;
      const next = value.replace(COLOR_TOKEN, token => {
        const replacement = replacements.get(colorFromCssToken(token));
        return replacement ? substituteCssColorToken(token, replacement) : token;
      });
      return full.replace(value, next);
    });
    return start + changed + end;
  });
}
