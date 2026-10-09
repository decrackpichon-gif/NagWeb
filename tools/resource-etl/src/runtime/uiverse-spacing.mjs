// Expose only genuine single-value px padding and margin declarations.
// Original CSS stays unmodified unless a valid, selected value changes.
const STYLE = /(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi;
const SPACING_DECL = /(^|[;{])(\s*)((?:padding|margin)(?:-(?:top|right|bottom|left))?)(\s*:\s*)(-?\d{1,3}(?:\.\d{1,2})?)px(\s*)(?=;|\})/gim;
const MAX_PROPS = 8;
const LABELS = Object.freeze({
  padding: "Relleno", "padding-top": "Relleno superior",
  "padding-right": "Relleno derecho", "padding-bottom": "Relleno inferior",
  "padding-left": "Relleno izquierdo",
  margin: "Margen", "margin-top": "Margen superior",
  "margin-right": "Margen derecho", "margin-bottom": "Margen inferior",
  "margin-left": "Margen izquierdo"
});

function limits(property) {
  return property.startsWith("margin")
    ? {min: -300, max: 800}
    : {min: 0, max: 400};
}

function originalHtml(resource) {
  const files = resource?.artifacts || [];
  const artifact = files.find(x => x.id === resource?.runtime?.entryArtifactId) ||
    files.find(x => x.role === "component");
  return String(artifact?.content || "");
}

function supports(resource) {
  return resource?.source?.provider === "uiverse" &&
    resource?.runtime?.renderer === "nagweb-html-tailwind";
}

// Replacing ignored spans with equal-length blanks makes offsets reliable.
function withoutStringsAndComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    text => text.replace(/[^\r\n]/g, " "));
}

function forEachSpacing(css, visit) {
  for (const m of withoutStringsAndComments(css).matchAll(SPACING_DECL)) {
    const property = m[3].toLowerCase();
    const number = Number(m[5]);
    const bounds = limits(property);
    if (!Number.isFinite(number) || number < bounds.min || number > bounds.max) continue;
    const offset = m.index + m[1].length + m[2].length + m[3].length + m[4].length;
    visit({property, number, offset, digits: m[5].length});
  }
}

export function inferUiverseCssSpacingProps(html) {
  const choices = [];
  const seen = new Set();
  for (const block of String(html || "").matchAll(STYLE)) {
    forEachSpacing(block[2], ({property, number}) => {
      const key = property + ":" + number;
      if (seen.has(key) || choices.length >= MAX_PROPS) return;
      seen.add(key);
      choices.push({property, number});
    });
  }
  return choices.map(({property, number}, index) => {
    const fraction = String(number).split(".")[1]?.length || 0;
    const bounds = limits(property);
    return {
      id: "uiverseSpace" + (index + 1),
      label: LABELS[property] + " (" + number + " px)",
      group: "Espaciado",
      valueType: "number", control: "slider", defaultValue: number,
      binding: {type:"css-spacing-declaration", property, originalValue:number},
      constraints: {...bounds, step: fraction ? 10 ** -fraction : 1, unit:"px"},
      responsive:true, animatable:false
    };
  });
}

export function isSupportedUiverseCssSpacing(resource, prop) {
  if (!supports(resource) || !prop ||
      prop.binding?.type !== "css-spacing-declaration" || prop.valueType !== "number") {
    return false;
  }
  return inferUiverseCssSpacingProps(originalHtml(resource)).some(actual =>
    actual.id === prop.id &&
    actual.defaultValue === prop.defaultValue &&
    actual.binding.property === prop.binding.property &&
    actual.binding.originalValue === prop.binding.originalValue &&
    actual.constraints.min === prop.constraints?.min &&
    actual.constraints.max === prop.constraints?.max &&
    actual.constraints.step === prop.constraints?.step &&
    actual.constraints.unit === prop.constraints?.unit);
}

export function applyUiverseCssSpacingValues(resource, values, html) {
  if (!supports(resource) || typeof html !== "string" || !html) return html || "";
  const changes = new Map();
  for (const prop of inferUiverseCssSpacingProps(originalHtml(resource))) {
    const chosen = Object.hasOwn(values || {}, prop.id) ? values[prop.id] : prop.defaultValue;
    if (typeof chosen !== "number" || !Number.isFinite(chosen) ||
        chosen < prop.constraints.min || chosen > prop.constraints.max ||
        chosen === prop.defaultValue) continue;
    const tick = (chosen - prop.constraints.min) / prop.constraints.step;
    if (Math.abs(tick - Math.round(tick)) > 1e-6) continue;
    changes.set(prop.binding.property + ":" + prop.defaultValue, String(chosen));
  }
  if (!changes.size) return html;
  return html.replace(STYLE, (_whole, start, css, end) => {
    const edits = [];
    forEachSpacing(css, ({property, number, offset, digits}) => {
      const replacement = changes.get(property + ":" + number);
      if (replacement !== undefined) edits.push({offset, digits, replacement});
    });
    let result = css;
    for (const edit of edits.reverse()) {
      result = result.slice(0, edit.offset) + edit.replacement +
        result.slice(edit.offset + edit.digits);
    }
    return start + result + end;
  });
}
