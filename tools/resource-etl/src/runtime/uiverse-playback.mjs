// Editable CSS animation repeat count and direction for Uiverse resources.
// Infer only explicit, unambiguous values from animation shorthands and longhands.
// Changes are scoped to the original property, track and token, never whole CSS.
const STYLE=/(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi;
const DECL=/(^|[;{])(\s*)(animation(?:-iteration-count|-direction)?)(\s*:\s*)([^;{}]*)(?=;|\})/gim;
const COUNT=/^(?:infinite|(?:0|[1-9]|1[0-2]))$/i;
const DIRECTION=/^(?:normal|reverse|alternate|alternate-reverse)$/i;
const TIME=/^-?(?:\d+(?:\.\d{1,3})?|\.\d{1,3})(?:ms|s)$/i;
const MAX_CONTROLS=8;
const COUNT_OPTIONS=Object.freeze([
  {value:"0",label:"No repetir (0)"},
  ...Array.from({length:12},(_,i)=>({
    value:String(i+1),label:i===0?"Una vez":(i+1)+" veces"
  })),
  {value:"infinite",label:"Repetición infinita"}
]);
const DIRECTION_OPTIONS=Object.freeze([
  {value:"normal",label:"Normal"},
  {value:"reverse",label:"Inversa"},
  {value:"alternate",label:"Alternar"},
  {value:"alternate-reverse",label:"Alternar empezando al revés"}
]);

function originalHtml(resource) {
  const items=resource?.artifacts||[];
  return String((items.find(i=>i.id===resource?.runtime?.entryArtifactId)||
    items.find(i=>i.role==="component"))?.content||"");
}

function supported(resource) {
  return resource?.source?.provider==="uiverse" &&
    resource?.runtime?.renderer==="nagweb-html-tailwind";
}

function maskText(css) {
  return css.replace(/\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    text=>text.replace(/[^\r\n]/g," "));
}

function tracksOf(value) {
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

function parseTrack(track,property) {
  // Known easing functions can contain commas and parentheses; obscure them
  // while preserving each token's original byte offset.
  const safe=track.replace(/\b(?:cubic-bezier|steps|linear)\([^()]*\)/gi,
    text=>" ".repeat(text.length));
  if(/[(),]/.test(safe)||/!important/i.test(safe))return null;
  const tokens=[...safe.matchAll(/\S+/g)];
  const isCount=property.endsWith("-iteration-count");
  const isDirection=property.endsWith("-direction");
  const isLonghand=isCount||isDirection;
  if(isLonghand && tokens.length!==1)return null;
  if(!isLonghand && !tokens.some(t=>TIME.test(t[0])&&!t[0].startsWith("-")))
    return null;
  const matched=[];
  for(const type of ["count","direction"]) {
    if(isCount && type!=="count" || isDirection && type!=="direction")continue;
    const items=tokens.filter(t=>
      type==="count"?COUNT.test(t[0]):DIRECTION.test(t[0]));
    if(items.length>1)return null;
    if(items.length===1) {
      const token=items[0];
      matched.push({type,original:token[0].toLowerCase(),
        offset:token.index,length:token[0].length});
    }
  }
  if(isLonghand && matched.length!==1)return null;
  return matched;
}

function scan(css,inspect) {
  const clean=maskText(css);
  for(const match of clean.matchAll(DECL)) {
    const property=match[3].toLowerCase();
    const value=match[5];
    if(/\b(?:var|calc|env|url)\s*\(/i.test(value))continue;
    const tracks=tracksOf(value);
    if(!tracks)continue;
    const parsed=tracks.map(t=>parseTrack(t.text,property));
    // Ignore an entire declaration if a track is ambiguous or unsupported.
    if(parsed.some(items=>!items))continue;
    const start=match.index+match[1].length+match[2].length+
      match[3].length+match[4].length;
    parsed.forEach((items,trackIndex)=>items.forEach(item=>{
      inspect({...item,property,trackIndex,
        offset:start+tracks[trackIndex].start+item.offset});
    }));
  }
}

function discovered(html) {
  const found=[],seen=new Set();
  for(const style of String(html||"").matchAll(STYLE)) {
    scan(style[2],({type,original,property,trackIndex})=>{
      const key=[property,trackIndex,type,original].join(":");
      if(seen.has(key)||found.length>=MAX_CONTROLS)return;
      seen.add(key);
      found.push({type,original,property,trackIndex});
    });
  }
  return found;
}

export function inferUiverseCssPlaybackProps(html) {
  return discovered(html).map(({type,original,property,trackIndex},index)=>({
    id:"uiversePlay"+(index+1),
    label:"Animación "+(trackIndex+1)+" · "+
      (type==="count"?"repeticiones":"dirección"),
    group:"Reproducción",
    valueType:"enum",control:"select",defaultValue:original,
    binding:{type:"css-playback-keyword",property,trackIndex,
      field:type,originalValue:original},
    constraints:{options:(type==="count"?COUNT_OPTIONS:DIRECTION_OPTIONS)
      .map(item=>({...item}))},
    responsive:true,animatable:false
  }));
}

export function isSupportedUiverseCssPlayback(resource,prop) {
  if(!supported(resource)||prop?.valueType!=="enum"||
    prop?.binding?.type!=="css-playback-keyword")return false;
  return inferUiverseCssPlaybackProps(originalHtml(resource)).some(actual=>
    actual.id===prop.id&&actual.defaultValue===prop.defaultValue&&
    actual.binding.property===prop.binding.property&&
    actual.binding.trackIndex===prop.binding.trackIndex&&
    actual.binding.field===prop.binding.field&&
    actual.binding.originalValue===prop.binding.originalValue&&
    JSON.stringify(actual.constraints.options)===
      JSON.stringify(prop.constraints?.options));
}

export function applyUiverseCssPlaybackValues(resource,values,html) {
  if(!supported(resource)||typeof html!=="string"||!html)return html||"";
  const choices=new Map();
  for(const prop of inferUiverseCssPlaybackProps(originalHtml(resource))) {
    const value=Object.hasOwn(values||{},prop.id)?values[prop.id]:prop.defaultValue;
    const options=prop.constraints.options;
    if(typeof value!=="string"||!options.some(p=>p.value===value)||
      value===prop.defaultValue)continue;
    const key=[prop.binding.property,prop.binding.trackIndex,
      prop.binding.field,prop.defaultValue].join(":");
    choices.set(key,value);
  }
  if(!choices.size)return html;
  return html.replace(STYLE,(_all,begin,body,end)=>{
    const edits=[];
    scan(body,({property,trackIndex,type,original,offset,length})=>{
      const replacement=choices.get([property,trackIndex,type,original].join(":"));
      if(replacement!==undefined)edits.push({offset,length,replacement});
    });
    let updated=body;
    for(const e of edits.reverse())
      updated=updated.slice(0,e.offset)+e.replacement+
        updated.slice(e.offset+e.length);
    return begin+updated+end;
  });
}
