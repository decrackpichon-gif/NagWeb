// Derive editable pixel dimensions from existing Uiverse CSS declarations.
// Simple px values only. Comments, strings, calc(), percentages and shorthand stay intact.
const STYLE_BLOCK = /(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi;
const PIXEL_DECL = /(^|[;{])(\s*)(border-radius|border-(?:top-left|top-right|bottom-left|bottom-right)-radius|(?:min-|max-)?width|(?:min-|max-)?height)(\s*:\s*)(\d{1,4}(?:\.\d{1,2})?)px(\s*)(?=;|\})/gim;
const MAX_CONTROLS = 8;
const LABELS = Object.freeze({
  "border-radius": "Esquinas", "border-top-left-radius": "Esquina superior izquierda",
  "border-top-right-radius": "Esquina superior derecha",
  "border-bottom-left-radius": "Esquina inferior izquierda",
  "border-bottom-right-radius": "Esquina inferior derecha",
  width: "Ancho", height: "Alto",
  "min-width": "Ancho mínimo", "min-height": "Alto mínimo",
  "max-width": "Ancho máximo", "max-height": "Alto máximo"
});

function maxFor(property) {
  return property.includes("radius") ? 300 : property.endsWith("height") ? 1200 : 2000;
}

function originalHtml(resource) {
  const artifacts = resource?.artifacts || [];
  const main = artifacts.find(item => item.id === resource?.runtime?.entryArtifactId) ||
    artifacts.find(item => item.role === "component");
  return String(main?.content || "");
}

function isUiverse(resource) {
  return resource?.source?.provider === "uiverse" &&
    resource?.runtime?.renderer === "nagweb-html-tailwind";
}

function maskCommentsAndStrings(css) {
  return css.replace(/\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    token => token.replace(/[^\r\n]/g, " "));
}

function eachPixelDecl(css, inspect) {
  const cleaned = maskCommentsAndStrings(css);
  for (const match of cleaned.matchAll(PIXEL_DECL)) {
    const property = match[3].toLowerCase();
    const number = Number(match[5]);
    if (!Number.isFinite(number) || number > maxFor(property)) continue;
    const offset = match.index + match[1].length + match[2].length +
      match[3].length + match[4].length;
    inspect({property, number, offset, length: match[5].length});
  }
}

export function inferUiverseCssDimensionProps(html) {
  const found = [];
  const seen = new Set();
  for (const block of String(html || "").matchAll(STYLE_BLOCK)) {
    eachPixelDecl(block[2], ({property, number}) => {
      const identity = property + ":" + number;
      if (seen.has(identity) || found.length >= MAX_CONTROLS) return;
      found.push({property, number});
      seen.add(identity);
    });
  }
  return found.map(({property, number}, index) => {
    const fractionDigits = String(number).split(".")[1]?.length || 0;
    return {
      id: "uiverseLength" + (index + 1),
      label: LABELS[property] + " (" + number + " px)",
      group: property.includes("radius") ? "Bordes" : "Dimensiones",
      valueType: "number", control: "slider", defaultValue: number,
      binding: {type: "css-pixel-declaration", property, originalValue: number},
      constraints: {min: 0, max: maxFor(property),
        step: fractionDigits ? 10 ** -fractionDigits : 1, unit: "px"},
      responsive: true, animatable: false
    };
  });
}

export function isSupportedUiverseCssDimension(resource, prop) {
  if (!isUiverse(resource) || !prop ||
      prop.binding?.type !== "css-pixel-declaration" ||
      prop.valueType !== "number") return false;
  return inferUiverseCssDimensionProps(originalHtml(resource)).some(item =>
    item.id === prop.id &&
    item.defaultValue === prop.defaultValue &&
    item.binding.property === prop.binding.property &&
    item.binding.originalValue === prop.binding.originalValue &&
    item.constraints.min === prop.constraints?.min &&
    item.constraints.max === prop.constraints?.max &&
    item.constraints.step === prop.constraints?.step &&
    item.constraints.unit === prop.constraints?.unit);
}

export function applyUiverseCssDimensionValues(resource, values, html) {
  if (!isUiverse(resource) || typeof html !== "string" || !html) return html || "";
  const changes = new Map();
  for (const prop of inferUiverseCssDimensionProps(originalHtml(resource))) {
    const chosen = Object.hasOwn(values || {}, prop.id) ? values[prop.id] : prop.defaultValue;
    if (typeof chosen !== "number" || !Number.isFinite(chosen) ||
        chosen < prop.constraints.min || chosen > prop.constraints.max ||
        chosen === prop.defaultValue) continue;
    const ticks = (chosen - prop.constraints.min) / prop.constraints.step;
    if (Math.abs(ticks - Math.round(ticks)) > 1e-6) continue;
    changes.set(prop.binding.property + ":" + prop.defaultValue, String(chosen));
  }
  if (!changes.size) return html;
  return html.replace(STYLE_BLOCK, (_whole, start, body, end) => {
    const edits = [];
    eachPixelDecl(body, ({property, number, offset, length}) => {
      const replacement = changes.get(property + ":" + number);
      if (replacement !== undefined) edits.push({offset, length, replacement});
    });
    let modified = body;
    for (const item of edits.reverse()) {
      modified = modified.slice(0, item.offset) +
        item.replacement + modified.slice(item.offset + item.length);
    }
    return start + modified + end;
  });
}
