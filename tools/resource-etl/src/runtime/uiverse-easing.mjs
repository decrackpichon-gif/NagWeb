// Safe, per-track easing keyword controls for real Uiverse CSS declarations.
// Existing cubic-bezier()/steps()/linear() functions keep their own syntax and
// remain outside these preset selectors. Source HTML/CSS stays immutable.
const STYLE = /(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi;
const DECL = /(^|[;{])(\s*)(animation(?:-timing-function)?|transition(?:-timing-function)?)(\s*:\s*)([^;{}]*)(?=;|\})/gim;
const KEYWORD = /^(?:linear|ease|ease-in|ease-out|ease-in-out|step-start|step-end)$/i;
const TIME = /^-?(?:\d+(?:\.\d{1,3})?|\.\d{1,3})(?:ms|s)$/i;
const MAX_CONTROLS = 8;
const PRESETS = Object.freeze([
  {value:"ease",label:"Suave (ease)"},
  {value:"linear",label:"Constante (linear)"},
  {value:"ease-in",label:"Aceleración progresiva (ease-in)"},
  {value:"ease-out",label:"Frenado progresivo (ease-out)"},
  {value:"ease-in-out",label:"Suave al inicio y al final"},
  {value:"step-start",label:"Salto al inicio"},
  {value:"step-end",label:"Salto al final"}
]);

function originalHtml(resource) {
  const items=resource?.artifacts||[];
  return String((items.find(item=>item.id===resource?.runtime?.entryArtifactId)||
    items.find(item=>item.role==="component"))?.content||"");
}

function supports(resource) {
  return resource?.source?.provider==="uiverse" &&
    resource?.runtime?.renderer==="nagweb-html-tailwind";
}

function maskCommentsAndStrings(css) {
  return css.replace(/\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    token=>token.replace(/[^\r\n]/g," "));
}

function splitTopLevel(value) {
  let depth=0,start=0;
  const tracks=[];
  for(let i=0;i<value.length;i++) {
    if(value[i]==="(")depth++;
    else if(value[i]===")") {
      if(--depth<0)return null;
    } else if(value[i]==="," && depth===0) {
      tracks.push({start,text:value.slice(start,i)});
      start=i+1;
    }
  }
  if(depth!==0)return null;
  tracks.push({start,text:value.slice(start)});
  return tracks.length>6 || tracks.some(t=>!t.text.trim())?null:tracks;
}

function keywordInTrack(track,property) {
  // In shorthand, keywords must be outside any CSS functions. Requiring a
  // duration makes the shorthand recognizable rather than guessing at names.
  if(/[()]/.test(track))return null;
  const tokens=[...track.matchAll(/\S+/g)];
  const longhand=property.endsWith("-timing-function");
  if(longhand) {
    if(tokens.length!==1 || !KEYWORD.test(tokens[0][0]))return null;
    return {keyword:tokens[0][0].toLowerCase(),offset:tokens[0].index,
      length:tokens[0][0].length};
  }
  const clocks=tokens.filter(t=>TIME.test(t[0]));
  if(!clocks.length || clocks.length>2 || clocks[0][0].startsWith("-"))return null;
  const keys=tokens.filter(t=>KEYWORD.test(t[0]));
  if(keys.length!==1)return null;
  return {keyword:keys[0][0].toLowerCase(),offset:keys[0].index,
    length:keys[0][0].length};
}

function scan(css,callback) {
  const safe=maskCommentsAndStrings(css);
  for(const match of safe.matchAll(DECL)) {
    const property=match[3].toLowerCase();
    const value=match[5];
    if(/!important|\b(?:var|calc|env|url)\s*\(/i.test(value))continue;
    const tracks=splitTopLevel(value);
    if(!tracks)continue;
    const base=match.index+match[1].length+match[2].length+
      match[3].length+match[4].length;
    // Per-track edits: leave tracks without an explicit keyword untouched.
    tracks.forEach((track,index)=>{
      const key=keywordInTrack(track.text,property);
      if(!key)return;
      callback({property,trackIndex:index,keyword:key.keyword,
        offset:base+track.start+key.offset,length:key.length});
    });
  }
}

function foundProps(html) {
  const found=[],seen=new Set();
  for(const style of String(html||"").matchAll(STYLE)) {
    scan(style[2],({property,trackIndex,keyword})=>{
      const key=property+":"+trackIndex+":"+keyword;
      if(seen.has(key)||found.length>=MAX_CONTROLS)return;
      seen.add(key);
      found.push({property,trackIndex,keyword});
    });
  }
  return found;
}

export function inferUiverseCssEasingProps(html) {
  return foundProps(html).map(({property,trackIndex,keyword},index)=>({
    id:"uiverseEase"+(index+1),
    label:(property.startsWith("animation")?"Animación":"Transición")+
      " "+(trackIndex+1)+" · aceleración",
    group:"Movimiento",
    valueType:"enum",control:"select",defaultValue:keyword,
    binding:{type:"css-easing-keyword",property,trackIndex,originalValue:keyword},
    constraints:{options:PRESETS.map(p=>({...p}))},
    responsive:true,animatable:false
  }));
}

export function isSupportedUiverseCssEasing(resource,prop) {
  if(!supports(resource)||prop?.valueType!=="enum"||
    prop?.binding?.type!=="css-easing-keyword")return false;
  return inferUiverseCssEasingProps(originalHtml(resource)).some(actual=>
    actual.id===prop.id && actual.defaultValue===prop.defaultValue &&
    actual.binding.property===prop.binding.property &&
    actual.binding.trackIndex===prop.binding.trackIndex &&
    actual.binding.originalValue===prop.binding.originalValue &&
    JSON.stringify(actual.constraints.options)===
      JSON.stringify(prop.constraints?.options));
}

export function applyUiverseCssEasingValues(resource,values,html) {
  if(!supports(resource)||typeof html!=="string"||!html)return html||"";
  const choices=new Map();
  for(const prop of inferUiverseCssEasingProps(originalHtml(resource))) {
    const next=Object.hasOwn(values||{},prop.id)?values[prop.id]:prop.defaultValue;
    if(typeof next!=="string"||!PRESETS.some(p=>p.value===next)||
      next===prop.defaultValue)continue;
    choices.set([prop.binding.property,prop.binding.trackIndex,
      prop.defaultValue].join(":"),next);
  }
  if(!choices.size)return html;
  return html.replace(STYLE,(_whole,before,css,after)=>{
    const edits=[];
    scan(css,({property,trackIndex,keyword,offset,length})=>{
      const replacement=choices.get([property,trackIndex,keyword].join(":"));
      if(replacement)edits.push({offset,length,replacement});
    });
    let result=css;
    for(const {offset,length,replacement} of edits.reverse()) {
      result=result.slice(0,offset)+replacement+result.slice(offset+length);
    }
    return before+result+after;
  });
}
