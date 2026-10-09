// Editable cubic-bezier curves for real Uiverse CSS animation declarations.
// Detects up to three existing valid curves. Each of their four coordinates
// changes independently without rewriting other CSS, comments or HTML.
const STYLE = /(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi;
const DECL = /(^|[;{])(\s*)(animation(?:-timing-function)?|transition(?:-timing-function)?)(\s*:\s*)([^;{}]*)(?=;|\})/gim;
const FUNCTION = /\bcubic-bezier\(([^()]*)\)/gi;
const COORD = /^-?(?:\d+(?:\.\d{1,3})?|\.\d{1,3})$/;
const MAX_CURVES = 3;
const LABELS = ["P1 · X", "P1 · Y", "P2 · X", "P2 · Y"];

function sourceHtml(resource) {
  const a=resource?.artifacts||[];
  return String((a.find(x=>x.id===resource?.runtime?.entryArtifactId)||
    a.find(x=>x.role==="component"))?.content||"");
}

function compatible(resource) {
  return resource?.source?.provider==="uiverse" &&
    resource?.runtime?.renderer==="nagweb-html-tailwind";
}

function safeCss(css) {
  return css.replace(/\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    m=>m.replace(/[^\r\n]/g," "));
}

function readCoordinates(raw) {
  const parts=raw.split(",");
  if(parts.length!==4)return null;
  const numbers=parts.map(part=>part.trim());
  if(numbers.some(part=>!COORD.test(part)))return null;
  const coords=numbers.map(Number);
  if(coords.some((number,i)=>!Number.isFinite(number) ||
    number<(i%2 ? -2 : 0) || number>(i%2 ? 2 : 1)))return null;
  return {parts,coords};
}

function scan(css,callback) {
  const source=safeCss(css);
  for(const decl of source.matchAll(DECL)) {
    const property=decl[3].toLowerCase();
    const body=decl[5];
    if(/!important|\b(?:url|var|calc|env)\s*\(/i.test(body))continue;
    const base=decl.index+decl[1].length+decl[2].length+
      decl[3].length+decl[4].length;
    let curveIndex=0;
    for(const match of body.matchAll(FUNCTION)) {
      const parsed=readCoordinates(match[1]);
      if(!parsed)continue;
      const start=base+match.index+match[0].indexOf("(")+1;
      let offset=start;
      const positions=parsed.parts.map(part=>{
        const leading=part.length-part.trimStart().length;
        const result={offset:offset+leading,length:part.trim().length};
        offset+=part.length+1;
        return result;
      });
      callback({property,curveIndex,coords:parsed.coords,positions});
      curveIndex++;
    }
  }
}

function curves(html) {
  const found=[],seen=new Set();
  for(const block of String(html||"").matchAll(STYLE)) {
    scan(block[2],({property,curveIndex,coords})=>{
      const key=property+":"+curveIndex+":"+coords.join(",");
      if(seen.has(key)||found.length>=MAX_CURVES)return;
      seen.add(key);
      found.push({property,curveIndex,coords});
    });
  }
  return found;
}

export function inferUiverseCssBezierProps(html) {
  const all=[];
  for(const {property,curveIndex,coords} of curves(html)) {
    const family=property.startsWith("animation")?"Animación":"Transición";
    for(let i=0;i<4;i++) {
      const value=coords[i];
      const isY=i%2===1;
      const fractional=String(value).split(".")[1]?.length||0;
      all.push({
        id:"uiverseBezier"+(all.length+1),
        label:family+" · curva "+(curveIndex+1)+" · "+LABELS[i],
        group:"Curvas de movimiento",
        valueType:"number",control:"slider",defaultValue:value,
        binding:{type:"css-bezier-coordinate",property,curveIndex,
          coordinate:i,originalCurve:coords.join(",")},
        constraints:{min:isY?-2:0,max:isY?2:1,
          step:Math.min(0.01,10**-fractional)},
        responsive:true,animatable:false
      });
    }
  }
  return all;
}

export function isSupportedUiverseCssBezier(resource,prop) {
  if(!compatible(resource)||prop?.valueType!=="number" ||
      prop.binding?.type!=="css-bezier-coordinate")return false;
  return inferUiverseCssBezierProps(sourceHtml(resource)).some(actual=>
    actual.id===prop.id&&actual.defaultValue===prop.defaultValue&&
    actual.binding.property===prop.binding.property&&
    actual.binding.curveIndex===prop.binding.curveIndex&&
    actual.binding.coordinate===prop.binding.coordinate&&
    actual.binding.originalCurve===prop.binding.originalCurve&&
    actual.constraints.min===prop.constraints?.min&&
    actual.constraints.max===prop.constraints?.max&&
    actual.constraints.step===prop.constraints?.step);
}

export function applyUiverseCssBezierValues(resource,values,html) {
  if(!compatible(resource)||typeof html!=="string"||!html)return html||"";
  const chosen=new Map();
  for(const prop of inferUiverseCssBezierProps(sourceHtml(resource))) {
    const value=Object.hasOwn(values||{},prop.id)?values[prop.id]:prop.defaultValue;
    if(typeof value!=="number"||!Number.isFinite(value)||
      value<prop.constraints.min||value>prop.constraints.max||
      value===prop.defaultValue)continue;
    const steps=(value-prop.constraints.min)/prop.constraints.step;
    if(Math.abs(steps-Math.round(steps))>1e-6)continue;
    chosen.set([prop.binding.property,prop.binding.curveIndex,
      prop.binding.originalCurve,prop.binding.coordinate].join(":"),String(value));
  }
  if(!chosen.size)return html;
  return html.replace(STYLE,(_whole,before,css,after)=>{
    const edits=[];
    scan(css,({property,curveIndex,coords,positions})=>{
      const identity=coords.join(",");
      for(let i=0;i<4;i++) {
        const next=chosen.get([property,curveIndex,identity,i].join(":"));
        if(next===undefined)continue;
        edits.push({...positions[i],next});
      }
    });
    let output=css;
    for(const edit of edits.reverse()) {
      output=output.slice(0,edit.offset)+edit.next+
        output.slice(edit.offset+edit.length);
    }
    return before+output+after;
  });
}
