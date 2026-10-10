// Local customizations for a single Resource Vault resource.
// Each stored value is revalidated against current editable controls.
export const SAVED_PRESETS_KEY="nagweb:resource-browser:customizations:v1";
const MAX_RESOURCES=50, MAX_FIELDS=96, MAX_BYTES=160000;
const validId=id=>typeof id==="string"&&id.length>0&&id.length<=180&&
  /^[a-zA-Z0-9:._/-]+$/.test(id);
const validField=id=>typeof id==="string"&&id.length<=96&&
  /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(id);
function validValue(c,value){
  switch(c?.kind){
    case "color": return typeof value==="string"&&/^#[a-f0-9]{6}$/i.test(value);
    case "toggle":return typeof value==="boolean";
    case "select":return typeof value==="string"&&
      (c.options||[]).some(option=>option.value===value);
    case "text":return typeof value==="string"&&!!value.trim()&&
      value.length<=Math.min(256,c.maxLength||256)&&
      !/[\x00-\x1f\x7f]/.test(value);
    case "range":{
      if(typeof value!=="number"||!Number.isFinite(value)||
        !Number.isFinite(c.min)||!Number.isFinite(c.max)||
        !Number.isFinite(c.step)||c.step<=0||
        value<c.min||value>c.max)return false;
      const ticks=(value-c.min)/c.step;
      return Math.abs(ticks-Math.round(ticks))<1e-6;
    }
    default:return false;
  }
}
function validated(controls,values){
  if(!values||typeof values!=="object"||Array.isArray(values))return {};
  const result={};let n=0;
  for(const c of controls||[]){
    if(n>=MAX_FIELDS)break;
    if(validField(c?.id)&&Object.hasOwn(values,c.id)&&
       validValue(c,values[c.id])&&values[c.id]!==c.defaultValue){
      Object.defineProperty(result,c.id,{value:values[c.id],
        enumerable:true,configurable:true,writable:true});
      n++;
    }
  }
  return result;
}
// Return null on unreadable or malformed storage. A failed read must never
// silently turn a subsequent save/delete into a destructive replacement.
function loadEntries(storage,key){
  try{
    if(typeof storage?.getItem!=="function")return null;
    const raw=storage.getItem(key);
    if(raw===null||raw==="")return [];
    if(typeof raw!=="string"||raw.length>MAX_BYTES)return null;
    const entries=JSON.parse(raw);
    if(!Array.isArray(entries))return null;
    const map=new Map();
    for(const entry of entries.slice(-MAX_RESOURCES)){
      if(Array.isArray(entry)&&entry.length===2&&validId(entry[0])&&
        entry[1]&&typeof entry[1]==="object"&&!Array.isArray(entry[1])){
        map.set(entry[0],entry[1]);
      }
    }
    return [...map];
  }catch{return null;}
}
export function readSavedCustomization(storage,id,controls,key=SAVED_PRESETS_KEY){
  if(!validId(id))return null;
  const entries=loadEntries(storage,key);
  const entry=entries?.find(item=>item[0]===id);
  return entry?validated(controls,entry[1]):null;
}
export function saveSavedCustomization(storage,id,controls,values,key=SAVED_PRESETS_KEY){
  if(!validId(id)||!Array.isArray(controls)||!controls.length)return false;
  const existing=loadEntries(storage,key);
  if(!existing||typeof storage?.setItem!=="function")return false;
  const items=new Map(existing);
  items.delete(id);
  items.set(id,validated(controls,values));
  // Stay below the same maximum that the reader accepts. Retain the latest
  // preset and discard oldest entries first, instead of saving unreadable data.
  const entries=[...items].slice(-MAX_RESOURCES);
  let serialized=JSON.stringify(entries);
  while(serialized.length>MAX_BYTES&&entries.length>1){
    entries.shift();
    serialized=JSON.stringify(entries);
  }
  if(serialized.length>MAX_BYTES)return false;
  try{
    storage.setItem(key,serialized);
    return true;
  }catch{return false;}
}
export function deleteSavedCustomization(storage,id,key=SAVED_PRESETS_KEY){
  if(!validId(id))return false;
  const existing=loadEntries(storage,key);
  if(!existing||typeof storage?.setItem!=="function")return false;
  const items=new Map(existing);
  items.delete(id);
  try{
    storage.setItem(key,JSON.stringify([...items]));
    return true;
  }catch{return false;}
}
