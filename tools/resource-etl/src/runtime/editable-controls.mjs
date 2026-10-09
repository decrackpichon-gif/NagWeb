import { isSupportedHtmlCssProperty } from "./html-css-customization.mjs";
import { isSupportedUiverseCssDimension } from "./uiverse-dimensions.mjs";
import { isSupportedUiverseCssSpacing } from "./uiverse-spacing.mjs";
import { isSupportedUiverseCssTypeBorder } from "./uiverse-type-borders.mjs";
import { isSupportedUiverseCssTiming } from "./uiverse-timing.mjs";
import {
  effectiveUiverseEditableProps,
  isSupportedUiverseCssColor
} from "./uiverse-colors.mjs";

// Build safe metadata-driven controls for pre-insert customization.
export function describeEditableControls(resource) {
  const renderer = resource?.runtime?.renderer;
  if (![
    "nagweb-html-tailwind",
    "nagweb-svg",
    "lottie",
    "dotlottie-web",
    "nagweb-css-class-effect",
    "nagweb-css-inline-effect"
  ].includes(renderer)) return [];

  const controls = [];
  const seen = new Set();

  for (const prop of effectiveUiverseEditableProps(resource)) {
    const id = prop?.id;
    if (
      typeof id !== "string" ||
      !/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(id) ||
      id === "constructor" || seen.has(id)
    ) continue;

    const validBinding = renderer === "nagweb-html-tailwind"
      ? (prop.binding?.type === "css-variable" &&
        /^--[a-z][a-z0-9-]*$/i.test(prop.binding?.variable || "")) ||
        isSupportedHtmlCssProperty(prop) ||
        isSupportedUiverseCssColor(resource, prop) ||
        isSupportedUiverseCssDimension(resource, prop) ||
        isSupportedUiverseCssSpacing(resource, prop) ||
        isSupportedUiverseCssTypeBorder(resource, prop) ||
        isSupportedUiverseCssTiming(resource, prop)
      : renderer === "nagweb-svg"
        ? ["size", "stroke", "strokeWidth"].includes(id) &&
          prop.binding?.type === "runtime" &&
          prop.binding?.path === `svg.${id}`
        : ["lottie", "dotlottie-web"].includes(renderer)
          ? ["speed", "loop", "autoplay"].includes(id) &&
            prop.binding?.type === "runtime" &&
            prop.binding?.path === `lottie.${id}`
          : renderer === "nagweb-css-inline-effect"
            ? ["duration", "delay", "easing", "iterations"].includes(id) &&
              prop.binding?.type === "runtime" &&
              prop.binding?.path === `cssEffect.${id}`
            : id === "trigger" && prop.binding?.type === "runtime" &&
              prop.binding?.path === "cssEffect.trigger";
    if (!validBinding) continue;

    const base = {
      id,
      label: typeof prop.label === "string" && prop.label.trim()
        ? prop.label : id,
      defaultValue: prop.defaultValue
    };

    if (prop.valueType === "color" &&
        /^#[a-f\d]{6}$/i.test(prop.defaultValue || "")) {
      controls.push({ ...base, kind: "color" });
      seen.add(id);
      continue;
    }

    if (prop.valueType === "boolean" &&
        typeof prop.defaultValue === "boolean") {
      controls.push({ ...base, kind: "toggle" });
      seen.add(id);
      continue;
    }

    const choices = prop.constraints?.options;
    if (
      prop.valueType === "enum" &&
      Array.isArray(choices) && choices.length > 0 && choices.length <= 32 &&
      typeof prop.defaultValue === "string"
    ) {
      const options = [];
      const optionValues = new Set();
      for (const option of choices) {
        if (
          typeof option?.value !== "string" ||
          option.value.length > 80 ||
          !/^[a-zA-Z0-9 _.-]+$/.test(option.value) ||
          optionValues.has(option.value)
        ) continue;
        optionValues.add(option.value);
        options.push({
          value: option.value,
          label: typeof option.label === "string" && option.label.trim()
            ? option.label.slice(0, 100) : option.value
        });
      }
      if (options.length > 0 && optionValues.has(prop.defaultValue)) {
        controls.push({ ...base, kind: "select", options });
        seen.add(id);
        continue;
      }
    }

    const { min, max, step, unit = "" } = prop.constraints || {};
    if (
      prop.valueType === "number" &&
      Number.isFinite(prop.defaultValue) &&
      Number.isFinite(min) && Number.isFinite(max) &&
      Number.isFinite(step) && min <= prop.defaultValue &&
      prop.defaultValue <= max && min < max && step > 0 &&
      typeof unit === "string" &&
      /^(?:|px|em|rem|%|vw|vh|s|ms|deg)$/.test(unit)
    ) {
      controls.push({ ...base, kind: "range", min, max, step, unit });
      seen.add(id);
    }
  }
  return controls;
}

// Keep the existing CSS-specific API for consumers that only expect CSS controls.
export function describeCssEditableControls(resource) {
  return resource?.runtime?.renderer === "nagweb-html-tailwind"
    ? describeEditableControls(resource)
    : [];
}
