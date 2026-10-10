// Text customization of simple, already-existing Uiverse UI labels.
// This deliberately does not parse arbitrary HTML templates or run scripts.
// CSS, comments and attributes remain untouched; safe text-only inner content
// in button/span/label is the only editable surface.
const MASKED=/<(?:style|script)\b[^>]*>[\s\S]*?<\/(?:style|script)\s*>|<!--[\s\S]*?-->/gi;
const TEXT_TAG=/<(button|span|label)\b([^<>]*)>([^<>]{1,120})<\/\1\s*>/gi;
const MAX_LABELS=6;
const MAX_LENGTH=80;

function mainHtml(resource) {
  const list=resource?.artifacts||[];
  return String((list.find(x=>x.id===resource?.runtime?.entryArtifactId)||
    list.find(x=>x.role==="component"))?.content||"");
}

function compatible(resource) {
  return resource?.source?.provider==="uiverse" &&
    resource?.runtime?.renderer==="nagweb-html-tailwind";
}

function maskInactive(html) {
  return html.replace(MASKED,text=>text.replace(/[^\r\n]/g," "));
}

function inspectText(html,visitor) {
  const safe=maskInactive(html);
  for(const match of safe.matchAll(TEXT_TAG)) {
    const tag=match[1].toLowerCase();
    const attrs=match[2];
    // Keep content-only labels. Rich/nested markup is left for a future editor.
    if(/\bon[a-z]+\s*=|\bcontenteditable\s*=|\bdata-nagweb-/i.test(attrs))continue;
    const text=match[3].trim();
    if(text.length<1 || text.length>MAX_LENGTH || /[&\x00-\x1f\x7f]/.test(text) ||
      !/[\p{L}\p{N}]/u.test(text)) continue;
    const lead=match[3].length-match[3].trimStart().length;
    const offset=match.index+match[0].indexOf(">")+1+lead;
    visitor({tag,text,offset,length:text.length});
  }
}

function originals(html) {
  const found=[],seen=new Set();
  inspectText(String(html||""),({tag,text})=>{
    const key=tag+":"+text;
    if(seen.has(key)||found.length>=MAX_LABELS)return;
    seen.add(key);
    found.push({tag,text});
  });
  return found;
}

export function inferUiverseTextProps(html) {
  return originals(html).map(({tag,text},index)=>({
    id:"uiverseText"+(index+1),
    label:(tag==="button"?"Texto del botón":tag==="label"?"Texto de etiqueta":"Texto del componente")+
      " "+(index+1),
    group:"Contenido",
    valueType:"string",control:"text",defaultValue:text,
    binding:{type:"uiverse-text-label",tag,originalText:text},
    constraints:{maxLength:MAX_LENGTH},
    responsive:true,animatable:false
  }));
}

export function isSupportedUiverseText(resource,prop) {
  if(!compatible(resource)||prop?.valueType!=="string"||
     prop?.binding?.type!=="uiverse-text-label")return false;
  return inferUiverseTextProps(mainHtml(resource)).some(actual=>
    actual.id===prop.id && actual.defaultValue===prop.defaultValue &&
    actual.binding.tag===prop.binding.tag &&
    actual.binding.originalText===prop.binding.originalText &&
    actual.constraints.maxLength===prop.constraints?.maxLength);
}

function validText(value) {
  return typeof value==="string" && value.length>0 &&
    value.length<=MAX_LENGTH && value.trim().length>0 &&
    !/[\x00-\x1f\x7f]/.test(value);
}

function escapeHtml(text) {
  return text.replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

export function applyUiverseTextValues(resource,values,html) {
  if(!compatible(resource)||typeof html!=="string"||!html)return html||"";
  const replacements=new Map();
  for(const prop of inferUiverseTextProps(mainHtml(resource))) {
    const next=Object.hasOwn(values||{},prop.id)?values[prop.id]:prop.defaultValue;
    if(validText(next)&&next!==prop.defaultValue)
      replacements.set(prop.binding.tag+":"+prop.defaultValue,escapeHtml(next));
  }
  if(!replacements.size)return html;
  // Only replace original source spans in the same structural location:
  // never replace strings inside script, style, comment or attributes.
  const edits=[];
  inspectText(html,({tag,text,offset,length})=>{
    const replacement=replacements.get(tag+":"+text);
    if(replacement!==undefined)edits.push({offset,length,replacement});
  });
  let updated=html;
  for(const {offset,length,replacement} of edits.reverse())
    updated=updated.slice(0,offset)+replacement+updated.slice(offset+length);
  return updated;
}
