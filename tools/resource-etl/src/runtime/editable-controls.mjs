// Build safe, metadata-driven color and range controls for browser previews.
export function describeEditableControls(resource) {
  const renderer = resource?.runtime?.renderer;
  if (!["nagweb-html-tailwind", "nagweb-svg"].includes(renderer)) return [];

  const controls = [];
  const seen = new Set();

  for (const prop of resource.editableProps || []) {
    const id = prop?.id;
    if (typeof id !== "string" || !id || seen.has(id)) continue;

    const validBinding = renderer === "nagweb-html-tailwind"
      ? prop.binding?.type === "css-variable" &&
        /^--[a-z][a-z0-9-]*$/i.test(prop.binding?.variable || "")
      : ["size", "stroke", "strokeWidth"].includes(id) &&
        prop.binding?.type === "runtime" &&
        prop.binding?.path === `svg.${id}`;
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
