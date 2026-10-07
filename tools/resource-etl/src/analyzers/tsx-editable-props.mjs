function parseLiteral(value) {
  if (value == null) return undefined;
  const raw = String(value).trim();

  if (/^["'`][\s\S]*["'`]$/.test(raw)) return raw.slice(1, -1);
  if (/^-?\d+(?:\.\d+)?$/.test(raw)) return Number(raw);
  if (raw === "true") return true;
  if (raw === "false") return false;

  if (/^\[[\s\S]*\]$/.test(raw)) {
    const strings = [...raw.matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
    if (strings.length) return strings;
  }

  return undefined;
}

function constraintsFor(name, type) {
  const n = name.toLowerCase();
  if (!/number/.test(type)) return undefined;
  if (n.includes("opacity")) return { min: 0, max: 1, step: 0.01 };
  if (n.includes("angle") || n.includes("rotation")) return { min: -180, max: 180, step: 1, unit: "deg" };
  if (n.includes("speed")) return { min: 0.1, max: 5, step: 0.1 };
  if (n.includes("blur")) return { min: 0, max: 200, step: 1, unit: "px" };
  if (n.includes("duration")) return { min: 0.1, max: 30, step: 0.1, unit: "s" };
  if (n.includes("size")) return { min: 0, max: 1200, step: 1, unit: "px" };
  if (n.includes("count")) return { min: 0, max: 500, step: 1 };
  return { min: -1000, max: 1000, step: 1 };
}

function unionOptions(type) {
  const values = [...String(type).matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
  return values.length >= 2
    ? values.map((value) => ({ label: value, value }))
    : null;
}

function guessDefault(name, type, defaults) {
  if (Object.prototype.hasOwnProperty.call(defaults, name)) return defaults[name];
  if (/boolean/.test(type)) return false;
  if (/number/.test(type)) return 0;
  if (/string\[\]/.test(type) || /Array<string>/.test(type)) return [];
  if (/string/.test(type)) return "";
  return null;
}

export function inferEditablePropsFromTsx(code) {
  const source = String(code || "");
  const defaults = {};

  for (const match of source.matchAll(/\b([A-Za-z_$][\w$]*)\s*=\s*([^,}\n]+)/g)) {
    const parsed = parseLiteral(match[2]);
    if (parsed !== undefined) defaults[match[1]] = parsed;
  }

  const propBlocks = [];
  for (const match of source.matchAll(
    /(?:interface|type)\s+([A-Za-z_$][\w$]*Props)\s*(?:=)?\s*\{([\s\S]*?)\n\}/g
  )) {
    propBlocks.push(match[2]);
  }

  const seen = new Set();
  const props = [];

  for (const block of propBlocks) {
    for (const line of block.split("\n")) {
      const match = line.match(/^\s*([A-Za-z_$][\w$]*)\??:\s*([^;]+);?\s*$/);
      if (!match) continue;

      const name = match[1];
      const type = match[2].trim();
      if (seen.has(name) || ["className", "style", "ref", "key"].includes(name)) continue;
      seen.add(name);

      const lowerName = name.toLowerCase();
      const options = unionOptions(type);
      let control = "custom";
      let valueType = "object";

      if (name === "children" || lowerName.includes("text") || lowerName.includes("label")) {
        control = name === "children" ? "textarea" : "text";
        valueType = "string";
      } else if (/string/.test(type) && /(color|from|to|background|border)/i.test(name)) {
        control = "color";
        valueType = "color";
      } else if (options) {
        control = "select";
        valueType = "enum";
      } else if (/boolean/.test(type)) {
        control = "toggle";
        valueType = "boolean";
      } else if (/number/.test(type)) {
        control = "slider";
        valueType = "number";
      } else if (/string\[\]|Array<string>/.test(type)) {
        control = "custom";
        valueType = "object";
      } else if (/string/.test(type)) {
        control = "text";
        valueType = "string";
      } else {
        continue;
      }

      props.push({
        id: name,
        label: name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (v) => v.toUpperCase()),
        group: name === "children" || /text|label|content/i.test(name) ? "Contenido" : "Propiedades",
        valueType,
        control,
        defaultValue: guessDefault(name, type, defaults),
        binding: name === "children"
          ? { type: "text-content" }
          : { type: "component-prop", prop: name },
        constraints: options ? { options } : constraintsFor(name, type),
        responsive: true,
        animatable: valueType === "number" || valueType === "color"
      });
    }
  }

  return props;
}
