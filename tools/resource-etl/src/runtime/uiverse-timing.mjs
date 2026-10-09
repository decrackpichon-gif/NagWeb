// CSS animation and transition timing controls for Uiverse HTML components.
// Only explicit single-value declarations and uncomplicated single-track
// shorthands are edited. Nothing else in the source CSS is rewritten.
const STYLE = /(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi;
const DECL = /(^|[;{])(\s*)(animation(?:-duration|-delay)?|transition(?:-duration|-delay)?)(\s*:\s*)([^;{}]*)(?=;|\})/gim;
const CLOCK = /^(-?(?:\d+(?:\.\d{1,3})?|\.\d{1,3}))(ms|s)$/i;
const MAX_PROPS = 8;
const LIMITS = Object.freeze({duration:{min:0,max:20},delay:{min:-10,max:20}});
const LABELS = Object.freeze({
  animation:"Animación",transition:"Transición"
});

function originalHtml(resource) {
  const items = resource?.artifacts || [];
  return String((items.find(x => x.id === resource?.runtime?.entryArtifactId) ||
    items.find(x => x.role === "component"))?.content || "");
}

function compatible(resource) {
  return resource?.source?.provider === "uiverse" &&
    resource?.runtime?.renderer === "nagweb-html-tailwind";
}

function cleanCss(css) {
  return css.replace(/\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    text => text.replace(/[^\r\n]/g, " "));
}

function readTime(token) {
  const m = CLOCK.exec(token);
  if (!m) return null;
  const unit = m[2].toLowerCase();
  const number = Number(m[1]);
  const seconds = unit === "ms" ? number/1000 : number;
  if (!Number.isFinite(seconds)) return null;
  const precision = Math.round(seconds * 1000) / 1000;
  if (Math.abs(precision - seconds) > 1e-9) return null;
  return {seconds:precision,unit};
}

function visitTimings(css, inspect) {
  const clean = cleanCss(css);
  for (const match of clean.matchAll(DECL)) {
    const property = match[3].toLowerCase();
    const value = match[5];
    if (!value.trim() || /[,()]/.test(value) || /!important/i.test(value)) continue;
    const tokens = [...value.matchAll(/\S+/g)];
    const found = [];
    for (const token of tokens) {
      const time = readTime(token[0]);
      if (!time) continue;
      const role = property.endsWith("-delay") ? "delay" :
        property.endsWith("-duration") ? "duration" :
          found.length === 0 ? "duration" : "delay";
      const limits = LIMITS[role];
      if (time.seconds < limits.min || time.seconds > limits.max) {
        found.length = 0;
        break;
      }
      const valueStart = match.index + match[1].length + match[2].length +
        match[3].length + match[4].length;
      found.push({
        property,role,seconds:time.seconds,unit:time.unit,
        offset:valueStart+token.index,count:token[0].length
      });
    }
    const isLonghand = property.includes("-duration") || property.includes("-delay");
    if (isLonghand ? tokens.length !== 1 || found.length !== 1 :
      found.length < 1 || found.length > 2) continue;
    for (const item of found) inspect(item);
  }
}

function allProperties(html) {
  const found = [];
  const seen = new Set();
  for (const block of String(html || "").matchAll(STYLE)) {
    visitTimings(block[2], ({property,role,seconds,unit}) => {
      const key = property+":"+role+":"+seconds;
      if (found.length>=MAX_PROPS || seen.has(key)) return;
      seen.add(key);
      found.push({property,role,seconds,unit});
    });
  }
  return found;
}

export function inferUiverseCssTimingProps(html) {
  return allProperties(html).map(({property,role,seconds,unit},i) => {
    const family = property.startsWith("animation") ? "animation" : "transition";
    const fractionalDigits = String(seconds).split(".")[1]?.length || 0;
    const limits = LIMITS[role];
    return {
      id:"uiverseTime"+(i+1),
      label: LABELS[family]+" · "+(role==="duration"?"duración":"demora")+
        " ("+seconds+" s)",
      group:"Movimiento",
      valueType:"number",control:"slider",defaultValue:seconds,
      binding:{type:"css-timing-declaration",property,role,
        originalValue:seconds},
      constraints:{...limits,step:Math.min(0.05,10**-fractionalDigits),unit:"s"},
      responsive:true,animatable:false
    };
  });
}

export function isSupportedUiverseCssTiming(resource,prop) {
  if (!compatible(resource) || prop?.binding?.type!=="css-timing-declaration" ||
      prop?.valueType!=="number") return false;
  return inferUiverseCssTimingProps(originalHtml(resource)).some(actual =>
    actual.id===prop.id &&
    actual.defaultValue===prop.defaultValue &&
    actual.binding.property===prop.binding.property &&
    actual.binding.role===prop.binding.role &&
    actual.binding.originalValue===prop.binding.originalValue &&
    actual.constraints.min===prop.constraints?.min &&
    actual.constraints.max===prop.constraints?.max &&
    actual.constraints.step===prop.constraints?.step &&
    actual.constraints.unit===prop.constraints?.unit);
}

function encodeTime(seconds,unit) {
  return unit==="ms" ? Math.round(seconds*1000)+"ms" :
    Number(seconds.toFixed(3))+"s";
}

export function applyUiverseCssTimingValues(resource,values,html) {
  if (!compatible(resource) || typeof html!=="string" || !html) return html||"";
  const chosenValues = new Map();
  for (const prop of inferUiverseCssTimingProps(originalHtml(resource))) {
    const chosen = Object.hasOwn(values||{},prop.id) ? values[prop.id] : prop.defaultValue;
    if (typeof chosen!=="number" || !Number.isFinite(chosen) ||
        chosen<prop.constraints.min || chosen>prop.constraints.max ||
        chosen===prop.defaultValue) continue;
    const ticks=(chosen-prop.constraints.min)/prop.constraints.step;
    if (Math.abs(ticks-Math.round(ticks))>1e-6) continue;
    chosenValues.set(prop.binding.property+":"+prop.binding.role+":"+
      prop.defaultValue,chosen);
  }
  if (!chosenValues.size) return html;
  return html.replace(STYLE,(_original,before,body,after)=>{
    const edits=[];
    visitTimings(body,({property,role,seconds,unit,offset,count})=>{
      const chosen=chosenValues.get(property+":"+role+":"+seconds);
      if (chosen!==undefined) edits.push({offset,count,replacement:encodeTime(chosen,unit)});
    });
    let next=body;
    for (const {offset,count,replacement} of edits.reverse()) {
      next=next.slice(0,offset)+replacement+next.slice(offset+count);
    }
    return before+next+after;
  });
}
