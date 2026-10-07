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


function skipWhitespaceAndCommas(source, start) {
  let i = start;
  while (i < source.length && /[\s,]/.test(source[i])) i += 1;
  return i;
}

function readQuoted(source, start) {
  const quote = source[start];
  let i = start + 1;
  let value = "";

  while (i < source.length) {
    const char = source[i];
    if (char === "\\") {
      value += char;
      if (i + 1 < source.length) {
        value += source[i + 1];
        i += 2;
        continue;
      }
    }
    if (char === quote) {
      return { value, end: i + 1 };
    }
    value += char;
    i += 1;
  }

  return { value, end: source.length };
}

function findBalancedEnd(source, start, open = "{", close = "}") {
  if (source[start] !== open) return -1;

  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let i = start; i < source.length; i += 1) {
    const char = source[i];

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }

    if (char === open) depth += 1;
    if (char === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
}

function parseObjectEntries(source) {
  const entries = [];
  let i = 0;

  while (i < source.length) {
    i = skipWhitespaceAndCommas(source, i);
    if (i >= source.length) break;

    let key = "";
    if (source[i] === "'" || source[i] === '"' || source[i] === "`") {
      const quoted = readQuoted(source, i);
      key = quoted.value;
      i = quoted.end;
    } else {
      const keyMatch = source.slice(i).match(/^([A-Za-z_$][\w$-]*|-?\d+(?:\.\d+)?)/);
      if (!keyMatch) {
        i += 1;
        continue;
      }
      key = keyMatch[1];
      i += key.length;
    }

    i = skipWhitespaceAndCommas(source, i);
    if (source[i] !== ":") {
      while (i < source.length && source[i] !== "," && source[i] !== "\n") i += 1;
      continue;
    }

    i += 1;
    i = skipWhitespaceAndCommas(source, i);
    const valueStart = i;
    let rawValue = "";

    if (source[i] === "{") {
      const end = findBalancedEnd(source, i);
      if (end < 0) break;
      rawValue = source.slice(i, end + 1);
      i = end + 1;
    } else if (source[i] === "'" || source[i] === '"' || source[i] === "`") {
      const quoted = readQuoted(source, i);
      rawValue = source.slice(i, quoted.end);
      i = quoted.end;
    } else {
      let round = 0;
      let square = 0;
      let quote = null;
      let escaped = false;

      while (i < source.length) {
        const char = source[i];

        if (quote) {
          if (escaped) escaped = false;
          else if (char === "\\") escaped = true;
          else if (char === quote) quote = null;
          i += 1;
          continue;
        }

        if (char === "'" || char === '"' || char === "`") {
          quote = char;
          i += 1;
          continue;
        }

        if (char === "(") round += 1;
        else if (char === ")") round -= 1;
        else if (char === "[") square += 1;
        else if (char === "]") square -= 1;
        else if ((char === "," || char === "\n") && round === 0 && square === 0) break;

        i += 1;
      }

      rawValue = source.slice(valueStart, i).trim();
    }

    entries.push({ key, rawValue });
  }

  return entries;
}

function findNamedObjectBlocks(source, name) {
  const results = [];
  const regex = new RegExp(`\\b${name}\\s*:\\s*\\{`, "g");

  for (const match of source.matchAll(regex)) {
    const openIndex = source.indexOf("{", match.index);
    const end = findBalancedEnd(source, openIndex);
    if (end < 0) continue;
    results.push(source.slice(openIndex + 1, end));
  }

  return results;
}

function enumValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  return value;
}

export function inferCvaEditableProps(code) {
  const source = String(code || "");
  const defaults = {};

  for (const block of findNamedObjectBlocks(source, "defaultVariants")) {
    for (const entry of parseObjectEntries(block)) {
      const parsed = parseLiteral(entry.rawValue);
      if (parsed !== undefined) defaults[entry.key] = parsed;
    }
  }

  const props = [];
  const seen = new Set();

  for (const block of findNamedObjectBlocks(source, "variants")) {
    for (const variantEntry of parseObjectEntries(block)) {
      if (seen.has(variantEntry.key) || !variantEntry.rawValue.startsWith("{")) continue;

      const optionsBody = variantEntry.rawValue.slice(1, -1);
      const optionEntries = parseObjectEntries(optionsBody);
      const optionKeys = optionEntries.map((entry) => entry.key).filter(Boolean);
      if (!optionKeys.length) continue;

      seen.add(variantEntry.key);

      const booleanVariant =
        optionKeys.length === 2 &&
        optionKeys.includes("true") &&
        optionKeys.includes("false");

      if (booleanVariant) {
        props.push({
          id: variantEntry.key,
          label: variantEntry.key
            .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
            .replace(/^./, (v) => v.toUpperCase()),
          group: "Variantes",
          valueType: "boolean",
          control: "toggle",
          defaultValue:
            typeof defaults[variantEntry.key] === "boolean"
              ? defaults[variantEntry.key]
              : false,
          binding: { type: "component-prop", prop: variantEntry.key },
          responsive: true,
          animatable: false
        });
        continue;
      }

      const optionValues = optionKeys.map(enumValue);
      props.push({
        id: variantEntry.key,
        label: variantEntry.key
          .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
          .replace(/^./, (v) => v.toUpperCase()),
        group: "Variantes",
        valueType: "enum",
        control: "select",
        defaultValue:
          defaults[variantEntry.key] !== undefined
            ? defaults[variantEntry.key]
            : optionValues[0],
        binding: { type: "component-prop", prop: variantEntry.key },
        constraints: {
          options: optionValues.map((value) => ({
            label: String(value),
            value
          }))
        },
        responsive: true,
        animatable: false
      });
    }
  }

  for (const prop of inferEditablePropsFromTsx(source)) {
    if (seen.has(prop.id)) continue;
    seen.add(prop.id);
    props.push(prop);
  }

  return props;
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
