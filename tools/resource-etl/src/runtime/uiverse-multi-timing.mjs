// Timing controls for CSS animation/transition declarations with multiple tracks.
// A track is separated by a top-level comma, never a comma inside an easing function.
// Single-track declarations continue to use uiverse-timing.mjs and its stable IDs.
const STYLE = /(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi;
const DECL = /(^|[;{])(\s*)(animation(?:-duration|-delay)?|transition(?:-duration|-delay)?)(\s*:\s*)([^;{}]*)(?=;|\})/gim;
const TIME = /^(-?(?:\d+(?:\.\d{1,3})?|\.\d{1,3}))(ms|s)$/i;
const LIMITS = {duration:{min:0,max:20},delay:{min:-10,max:20}};
const MAX_CONTROLS = 8;

function sourceHtml(resource) {
  const items = resource?.artifacts || [];
  const main = items.find(x => x.id === resource?.runtime?.entryArtifactId) ||
    items.find(x => x.role === "component");
  return String(main?.content || "");
}

function isUiverse(resource) {
  return resource?.source?.provider === "uiverse" &&
    resource?.runtime?.renderer === "nagweb-html-tailwind";
}

function obscureStringsAndComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    m => m.replace(/[^\r\n]/g, " "));
}

function parseTime(token) {
  const found = TIME.exec(token);
  if (!found) return null;
  const number = Number(found[1]);
  const unit = found[2].toLowerCase();
  const seconds = unit === "ms" ? number / 1000 : number;
  if (!Number.isFinite(seconds) ||
      Math.abs(Math.round(seconds * 1000) / 1000 - seconds) > 1e-9) return null;
  return {seconds:Math.round(seconds * 1000) / 1000,unit};
}

function tracksOf(value) {
  // Reject broken nesting rather than guessing where to split tracks.
  let depth = 0, begin = 0;
  const tracks = [];
  for (let i=0;i<value.length;i++) {
    const c=value[i];
    if (c==="(") depth++;
    else if (c===")") {
      depth--;
      if (depth<0) return [];
    } else if (c==="," && depth===0) {
      tracks.push({start:begin,text:value.slice(begin,i)});
      begin=i+1;
    }
  }
  if (depth!==0) return [];
  tracks.push({start:begin,text:value.slice(begin)});
  return tracks.length>=2 && tracks.length<=6 &&
    tracks.every(t=>t.text.trim()) ? tracks : [];
}

function sanitizedTrack(track) {
  // Mask known timing functions only. No var/calc/env or unknown functions.
  const replaced = track.replace(/\b(?:cubic-bezier|steps|linear)\([^()]*\)/gi,
    m => " ".repeat(m.length));
  if (/[(),]/.test(replaced)) return null;
  return replaced;
}

function tokensForTrack(text,property) {
  const longhand = property.endsWith("-duration") || property.endsWith("-delay");
  const safe = longhand ? text : sanitizedTrack(text);
  if (safe===null || /!important/i.test(safe)) return null;
  const matches=[...safe.matchAll(/\S+/g)];
  const found=[];
  for (const match of matches) {
    const parsed = parseTime(match[0]);
    if (!parsed) continue;
    const role = property.endsWith("-duration") ? "duration" :
      property.endsWith("-delay") ? "delay" :
      found.length===0 ? "duration" : "delay";
    const limit = LIMITS[role];
    if (parsed.seconds<limit.min || parsed.seconds>limit.max) return null;
    found.push({...parsed,role,index:match.index,length:match[0].length});
  }
  if (longhand) {
    return matches.length===1 && found.length===1 ? found : null;
  }
  // A shorthand may have one duration and one delay, plus ordinary keywords.
  if (found.length<1 || found.length>2) return null;
  return found;
}

function visitMultiTiming(css,callback) {
  const safe=obscureStringsAndComments(css);
  for (const declaration of safe.matchAll(DECL)) {
    const property=declaration[3].toLowerCase();
    const raw=declaration[5];
    const tracks=tracksOf(raw);
    if (!tracks.length) continue;
    const parts=tracks.map(track=>tokensForTrack(track.text,property));
    // Fail closed for the entire multi-track declaration.
    if (parts.some(tokens=>!tokens)) continue;
    const offset=declaration.index+declaration[1].length+
      declaration[2].length+declaration[3].length+declaration[4].length;
    parts.forEach((tokens,trackIndex)=>tokens.forEach(item=>{
      callback({
        property,role:item.role,seconds:item.seconds,unit:item.unit,
        trackIndex,offset:offset+tracks[trackIndex].start+item.index,
        length:item.length
      });
    }));
  }
}

function discover(html) {
  const found=[],known=new Set();
  for(const block of String(html||"").matchAll(STYLE)) {
    visitMultiTiming(block[2],({property,role,seconds,trackIndex})=>{
      const key=[property,role,trackIndex,seconds].join(":");
      if(known.has(key)||found.length>=MAX_CONTROLS)return;
      known.add(key);
      found.push({property,role,seconds,trackIndex});
    });
  }
  return found;
}

export function inferUiverseCssMultiTimingProps(html) {
  return discover(html).map(({property,role,seconds,trackIndex},index)=>{
    const family=property.startsWith("animation")?"Animación":"Transición";
    const limits=LIMITS[role];
    const digits=String(seconds).split(".")[1]?.length||0;
    return {
      id:"uiverseTrack"+(index+1),
      label:family+" "+(trackIndex+1)+" · "+
        (role==="duration"?"duración":"demora")+" ("+seconds+" s)",
      group:"Movimiento",
      valueType:"number",control:"slider",defaultValue:seconds,
      binding:{type:"css-multi-timing",property,role,trackIndex,originalValue:seconds},
      constraints:{...limits,step:Math.min(0.05,10**-digits),unit:"s"},
      responsive:true,animatable:false
    };
  });
}

export function isSupportedUiverseCssMultiTiming(resource,prop) {
  if(!isUiverse(resource)||prop?.valueType!=="number"||
    prop.binding?.type!=="css-multi-timing")return false;
  return inferUiverseCssMultiTimingProps(sourceHtml(resource)).some(actual=>
    actual.id===prop.id&&actual.defaultValue===prop.defaultValue&&
    actual.binding.property===prop.binding.property&&
    actual.binding.role===prop.binding.role&&
    actual.binding.trackIndex===prop.binding.trackIndex&&
    actual.binding.originalValue===prop.binding.originalValue&&
    actual.constraints.min===prop.constraints?.min&&
    actual.constraints.max===prop.constraints?.max&&
    actual.constraints.step===prop.constraints?.step&&
    actual.constraints.unit===prop.constraints?.unit);
}

function formatTime(seconds,unit) {
  return unit==="ms"?Math.round(seconds*1000)+"ms":
    Number(seconds.toFixed(3))+"s";
}

export function applyUiverseCssMultiTimingValues(resource,values,html) {
  if(!isUiverse(resource)||typeof html!=="string"||!html)return html||"";
  const changes=new Map();
  for(const prop of inferUiverseCssMultiTimingProps(sourceHtml(resource))) {
    const value=Object.hasOwn(values||{},prop.id)?values[prop.id]:prop.defaultValue;
    if(typeof value!=="number"||!Number.isFinite(value)||
      value<prop.constraints.min||value>prop.constraints.max||
      value===prop.defaultValue)continue;
    const ticks=(value-prop.constraints.min)/prop.constraints.step;
    if(Math.abs(ticks-Math.round(ticks))>1e-6)continue;
    changes.set([prop.binding.property,prop.binding.role,
      prop.binding.trackIndex,prop.defaultValue].join(":"),value);
  }
  if(!changes.size)return html;
  return html.replace(STYLE,(_full,begin,css,end)=>{
    const edits=[];
    visitMultiTiming(css,({property,role,seconds,unit,trackIndex,offset,length})=>{
      const changed=changes.get([property,role,trackIndex,seconds].join(":"));
      if(changed!==undefined)edits.push({
        offset,length,replacement:formatTime(changed,unit)
      });
    });
    let result=css;
    for(const edit of edits.reverse()) {
      result=result.slice(0,edit.offset)+edit.replacement+
        result.slice(edit.offset+edit.length);
    }
    return begin+result+end;
  });
}
