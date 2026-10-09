// Expose genuine CSS font and border thickness values to the NagWeb editor.
// No arbitrary selectors, raw CSS input, comments, text strings or expressions.
const STYLE = /(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi;
const SIMPLE = /(^|[;{])(\s*)(font-size|font-weight|border-width|border-(?:top|right|bottom|left)-width)(\s*:\s*)(\d{1,3}(?:\.\d{1,2})?)(px)?(\s*)(?=;|\})/gim;
const BORDER_SHORTHAND = /(^|[;{])(\s*)(border(?:-(?:top|right|bottom|left))?)(\s*:\s*)(\d{1,2}(?:\.\d{1,2})?)px(?=\s+(?:solid|dashed|dotted|double)\b)/gim;
const MAX_PROPERTIES = 8;
const BORDER_NAME = {
  border: "Borde", "border-top": "Borde superior",
  "border-right": "Borde derecho", "border-bottom": "Borde inferior",
  "border-left": "Borde izquierdo", "border-width": "Grosor del borde",
  "border-top-width": "Grosor superior", "border-right-width": "Grosor derecho",
  "border-bottom-width": "Grosor inferior", "border-left-width": "Grosor izquierdo"
};

function cssSource(resource) {
  const artifacts = resource?.artifacts || [];
  const artifact = artifacts.find(item => item.id === resource?.runtime?.entryArtifactId) ||
    artifacts.find(item => item.role === "component");
  return String(artifact?.content || "");
}

function isUiverse(resource) {
  return resource?.source?.provider === "uiverse" &&
    resource?.runtime?.renderer === "nagweb-html-tailwind";
}

// Preserve positions while excluding CSS comments and string contents.
function visible(css) {
  return css.replace(/\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    chunk => chunk.replace(/[^\r\n]/g, " "));
}

function bounds(property) {
  if (property === "font-size") return {min:8,max:200};
  if (property === "font-weight") return {min:100,max:900};
  return {min:0,max:24};
}

function visitProperties(css, callback) {
  const clean = visible(css);
  const matches = [];
  for (const match of clean.matchAll(SIMPLE)) {
    const property = match[3].toLowerCase();
    const isWeight = property === "font-weight";
    if (isWeight ? Boolean(match[6]) : !match[6]) continue;
    const number = Number(match[5]);
    const range = bounds(property);
    if (!Number.isFinite(number) || number < range.min || number > range.max ||
        (isWeight && !Number.isInteger(number))) continue;
    matches.push({property, number,
      offset:match.index+match[1].length+match[2].length+match[3].length+match[4].length,
      count:match[5].length});
  }
  for (const match of clean.matchAll(BORDER_SHORTHAND)) {
    const property = match[3].toLowerCase();
    const number = Number(match[5]);
    if (!Number.isFinite(number) || number > bounds(property).max) continue;
    matches.push({property, number,
      offset:match.index+match[1].length+match[2].length+match[3].length+match[4].length,
      count:match[5].length});
  }
  matches.sort((a,b) => a.offset-b.offset);
  for (const item of matches) callback(item);
}

export function inferUiverseCssTypeBorderProps(html) {
  const found = [];
  const seen = new Set();
  for (const block of String(html || "").matchAll(STYLE)) {
    visitProperties(block[2], ({property, number}) => {
      const key = property + ":" + number;
      if (found.length >= MAX_PROPERTIES || seen.has(key)) return;
      found.push({property, number});
      seen.add(key);
    });
  }
  return found.map(({property, number}, index) => {
    const font = property.startsWith("font-");
    const fraction = String(number).split(".")[1]?.length || 0;
    const limits = bounds(property);
    return {
      id:"uiverseDetail" + (index+1),
      label: property === "font-size" ? "Tamaño de texto (" + number + " px)" :
        property === "font-weight" ? "Peso tipográfico (" + number + ")" :
        BORDER_NAME[property] + " (" + number + " px)",
      group:font ? "Tipografía" : "Bordes",
      valueType:"number",control:"slider",defaultValue:number,
      binding:{type:"css-type-border-declaration",property,originalValue:number},
      constraints:{...limits,step:fraction ? 10**-fraction : 1,
        unit:property === "font-weight" ? "" : "px"},
      responsive:true,animatable:false
    };
  });
}

export function isSupportedUiverseCssTypeBorder(resource, prop) {
  if (!isUiverse(resource) || prop?.binding?.type !== "css-type-border-declaration" ||
      prop?.valueType !== "number") return false;
  return inferUiverseCssTypeBorderProps(cssSource(resource)).some(actual =>
    actual.id === prop.id &&
    actual.defaultValue === prop.defaultValue &&
    actual.binding.property === prop.binding.property &&
    actual.binding.originalValue === prop.binding.originalValue &&
    actual.constraints.min === prop.constraints?.min &&
    actual.constraints.max === prop.constraints?.max &&
    actual.constraints.step === prop.constraints?.step &&
    actual.constraints.unit === prop.constraints?.unit);
}

export function applyUiverseCssTypeBorderValues(resource, values, html) {
  if (!isUiverse(resource) || typeof html !== "string" || !html) return html || "";
  const editsByKey = new Map();
  for (const prop of inferUiverseCssTypeBorderProps(cssSource(resource))) {
    const chosen = Object.hasOwn(values || {}, prop.id) ? values[prop.id] : prop.defaultValue;
    if (typeof chosen !== "number" || !Number.isFinite(chosen) ||
        chosen < prop.constraints.min || chosen > prop.constraints.max ||
        chosen === prop.defaultValue) continue;
    const ticks = (chosen - prop.constraints.min) / prop.constraints.step;
    if (Math.abs(ticks - Math.round(ticks)) > 1e-6) continue;
    editsByKey.set(prop.binding.property + ":" + prop.defaultValue, String(chosen));
  }
  if (!editsByKey.size) return html;
  return html.replace(STYLE, (_all, before, body, after) => {
    const edits = [];
    visitProperties(body, ({property, number, offset, count}) => {
      const next = editsByKey.get(property + ":" + number);
      if (next !== undefined) edits.push({offset,count,next});
    });
    let updated = body;
    for (const item of edits.reverse()) {
      updated = updated.slice(0,item.offset)+item.next+
        updated.slice(item.offset+item.count);
    }
    return before + updated + after;
  });
}
