// Pure metadata adapter for CSS-variable controls in the Resource Browser.
export function describeCssEditableControls(resource) {
  if (resource?.runtime?.renderer !== "nagweb-html-tailwind") return [];
  const seen = new Set();
  const controls = [];

  for (const prop of resource.editableProps || []) {
    const id = prop?.id;
    const variable = prop?.binding?.variable;
    if (
      typeof id !== "string" || !id ||
      seen.has(id) ||
      prop.binding?.type !== "css-variable" ||
      typeof variable !== "string" ||
      !/^--[a-z][a-z0-9-]*$/i.test(variable)
    ) continue;

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
