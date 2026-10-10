import { applyUiverseCssColorValues } from "./uiverse-colors.mjs";
import { applyUiverseCssDimensionValues } from "./uiverse-dimensions.mjs";
import { applyUiverseCssSpacingValues } from "./uiverse-spacing.mjs";
import { applyUiverseCssTypeBorderValues } from "./uiverse-type-borders.mjs";
import { applyUiverseCssTimingValues } from "./uiverse-timing.mjs";
import { applyUiverseCssMultiTimingValues } from "./uiverse-multi-timing.mjs";
import { applyUiverseCssBezierValues } from "./uiverse-bezier.mjs";
import { applyUiverseCssEasingValues } from "./uiverse-easing.mjs";
import { applyUiverseCssPlaybackValues } from "./uiverse-playback.mjs";
import { applyUiverseTextValues } from "./uiverse-text.mjs";
import { applyUiversePlaceholderValues } from "./uiverse-placeholder.mjs";

// Safely translate explicit, supported HTML styling props into visible edits.
// This is a small allowlist, not arbitrary CSS code supplied by a resource.
const HTML_STYLE_PROPS = Object.freeze({
  opacity: { min: 0, max: 1 },
  scale: { min: 0.5, max: 2 }
});

export function isSupportedHtmlCssProperty(prop) {
  const id = prop?.id;
  const bounds = HTML_STYLE_PROPS[id];
  return Boolean(
    bounds &&
    prop.binding?.type === "css-property" &&
    prop.binding.property === id &&
    prop.valueType === "number" &&
    Number.isFinite(prop.defaultValue) &&
    prop.defaultValue >= bounds.min && prop.defaultValue <= bounds.max &&
    Number.isFinite(prop.constraints?.min) &&
    Number.isFinite(prop.constraints?.max) &&
    prop.constraints.min >= bounds.min &&
    prop.constraints.max <= bounds.max &&
    prop.constraints.min < prop.constraints.max &&
    prop.defaultValue >= prop.constraints.min &&
    prop.defaultValue <= prop.constraints.max &&
    Number.isFinite(prop.constraints.step) &&
    prop.constraints.step > 0
  );
}

export function htmlCssPropertyStyle(resource, values = {}) {
  if (resource?.runtime?.renderer !== "nagweb-html-tailwind") return "";
  const declarations = [];
  const seen = new Set();
  for (const prop of resource.editableProps || []) {
    if (!isSupportedHtmlCssProperty(prop) || seen.has(prop.id)) continue;
    seen.add(prop.id);
    const selected = Object.hasOwn(values, prop.id) ? values[prop.id] : prop.defaultValue;
    const value = typeof selected === "number" &&
      Number.isFinite(selected) &&
      selected >= prop.constraints.min &&
      selected <= prop.constraints.max
      ? selected : prop.defaultValue;
    declarations.push(prop.id + ":" + String(value));
  }
  return declarations.join(";");
}

export function htmlWithCustomStyle(resource, values, html) {
  html = applyUiverseCssColorValues(resource, values, html);
  html = applyUiverseCssDimensionValues(resource, values, html);
  html = applyUiverseCssSpacingValues(resource, values, html);
  html = applyUiverseCssTypeBorderValues(resource, values, html);
  html = applyUiverseCssTimingValues(resource, values, html);
  html = applyUiverseCssMultiTimingValues(resource, values, html);
  html = applyUiverseCssBezierValues(resource, values, html);
  html = applyUiverseCssEasingValues(resource, values, html);
  html = applyUiverseCssPlaybackValues(resource, values, html);
  html = applyUiverseTextValues(resource, values, html);
  html = applyUiversePlaceholderValues(resource, values, html);
  const css = htmlCssPropertyStyle(resource, values);
  if (!css || !html) return html || "";
  // Inline style on the actual HTML wrapper survives the insert pipeline.
  return '<div data-nagweb-custom-style="1" style="' + css + '">' +
    html + "</div>";
}
