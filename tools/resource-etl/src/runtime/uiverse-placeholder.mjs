// Simple placeholder customization in imported Uiverse HTML forms.
// Parse quoted HTML attributes with a tiny tokenizer, not an unsafe regexp
// through other attribute strings. Avoid CSS/comments/scripts altogether.
const INACTIVE=/<(?:style|script)\b[^>]*>[\s\S]*?<\/(?:style|script)\s*>|<!--[\s\S]*?-->/gi;
const MAX_FIELDS=6;
const MAX_LENGTH=100;

function main(resource) {
  const entries=resource?.artifacts||[];
  return String((entries.find(e=>e.id===resource?.runtime?.entryArtifactId)||
    entries.find(e=>e.role==="component"))?.content||"");
}
const supported=r=>r?.source?.provider==="uiverse"&&
  r?.runtime?.renderer==="nagweb-html-tailwind";

function safeSource(html) {
  return html.replace(INACTIVE,part=>part.replace(/[^\r\n]/g," "));
}

function collectPlaceholders(html,callback) {
  const safe=safeSource(String(html||""));
  let pos=0;
  while(pos<safe.length) {
    const begin=safe.indexOf("<",pos);
    if(begin<0)break;
    let quote=null,end=begin+1,valid=true;
    for(;end<safe.length;end++) {
      const c=safe[end];
      if(quote){if(c===quote)quote=null;}
      else if(c==='"'||c==="'") quote=c;
      else if(c===">")break;
      else if(c==="<"){valid=false;break;}
    }
    if(!valid||end>=safe.length){pos=begin+1;continue;}
    pos=end+1;
    const tagMatch=/^<(input|textarea)\b/i.exec(safe.slice(begin,end+1));
    if(!tagMatch)continue;
    const tag=tagMatch[1].toLowerCase();
    const attrStart=begin+tagMatch[0].length;
    let cursor=attrStart,count=0,found=null;
    while(cursor<end) {
      while(cursor<end&&/[\s/]/.test(safe[cursor]))cursor++;
      if(cursor>=end)break;
      const nameMatch=/^[^\s=/<>]+/.exec(safe.slice(cursor,end));
      if(!nameMatch){valid=false;break;}
      const name=nameMatch[0].toLowerCase();
      cursor+=nameMatch[0].length;
      while(cursor<end&&/\s/.test(safe[cursor]))cursor++;
      if(safe[cursor]!=="=")continue;
      cursor++;
      while(cursor<end&&/\s/.test(safe[cursor]))cursor++;
      let raw="",offset=cursor,quoted=false;
      if(safe[cursor]==="'"||safe[cursor]==='"') {
        const delimiter=safe[cursor++];
        offset=cursor;
        const close=safe.indexOf(delimiter,cursor);
        if(close<0||close>end){valid=false;break;}
        raw=safe.slice(cursor,close);cursor=close+1;quoted=true;
      } else {
        const m=/^[^\s>]+/.exec(safe.slice(cursor,end));
        if(!m){valid=false;break;}
        raw=m[0];cursor+=raw.length;
      }
      if(name==="placeholder") {
        count++;
        if(quoted&&raw.length>0&&raw.length<=MAX_LENGTH&&
            !/[<>&\x00-\x1f\x7f]/.test(raw)&&raw.trim()&&
            /[\p{L}\p{N}]/u.test(raw)) {
          found={tag,raw,offset,length:raw.length};
        }
      }
    }
    if(valid&&count===1&&found)callback(found);
  }
}

function discovered(html) {
  const found=[],seen=new Set();
  collectPlaceholders(html,({tag,raw})=>{
    const key=tag+":"+raw;
    if(seen.has(key)||found.length>=MAX_FIELDS)return;
    seen.add(key);found.push({tag,raw});
  });
  return found;
}

export function inferUiversePlaceholderProps(html) {
  return discovered(String(html||"")).map(({tag,raw},index)=>({
    id:"uiverseHint"+(index+1),
    label:(tag==="input"?"Texto de campo":"Ayuda del área de texto")+" "+(index+1),
    group:"Contenido",valueType:"string",control:"text",defaultValue:raw,
    binding:{type:"uiverse-placeholder",tag,originalText:raw},
    constraints:{maxLength:MAX_LENGTH},responsive:true,animatable:false
  }));
}

export function isSupportedUiversePlaceholder(resource,prop) {
  if(!supported(resource)||prop?.valueType!=="string"||
      prop?.binding?.type!=="uiverse-placeholder")return false;
  return inferUiversePlaceholderProps(main(resource)).some(actual=>
    actual.id===prop.id&&actual.defaultValue===prop.defaultValue&&
    actual.binding.tag===prop.binding.tag&&
    actual.binding.originalText===prop.binding.originalText&&
    actual.constraints.maxLength===prop.constraints?.maxLength);
}

const validValue=value=>typeof value==="string"&&value.length>0&&
  value.length<=MAX_LENGTH&&value.trim()&&
  !/[\x00-\x1f\x7f]/.test(value);
function escapeAttribute(value) {
  return value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

export function applyUiversePlaceholderValues(resource,values,html) {
  if(!supported(resource)||typeof html!=="string"||!html)return html||"";
  const replacements=new Map();
  for(const prop of inferUiversePlaceholderProps(main(resource))) {
    const value=Object.hasOwn(values||{},prop.id)?values[prop.id]:prop.defaultValue;
    if(validValue(value)&&value!==prop.defaultValue)
      replacements.set(prop.binding.tag+":"+prop.defaultValue,escapeAttribute(value));
  }
  if(!replacements.size)return html;
  const edits=[];
  collectPlaceholders(html,({tag,raw,offset,length})=>{
    const replacement=replacements.get(tag+":"+raw);
    if(replacement!==undefined)edits.push({offset,length,replacement});
  });
  let updated=html;
  for(const change of edits.reverse())
    updated=updated.slice(0,change.offset)+change.replacement+
      updated.slice(change.offset+change.length);
  return updated;
}
