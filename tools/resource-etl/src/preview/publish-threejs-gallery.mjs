// Import ORIGINAL example screenshots from the pinned Three.js Git revision.
// These are not invented illustrations: files match mirrored source filenames.
// Zero executable Three.js is shipped to the user's browser.
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const argument=name=>process.argv.slice(2).find(a=>a.startsWith("--"+name+"="))?.slice(name.length+3);
const out=path.resolve(argument("out")||"resource-browser/three-previews");
const cap=Math.min(281,Math.max(1,Number(argument("limit")||281)));
const vaultRoot="https://raw.githubusercontent.com/decrackpichon-gif/NagWeb/resource-vault-data/";
async function get(url){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),18000);
  try{
    const response=await fetch(url,{signal:controller.signal,headers:{"User-Agent":"NagWeb-05-verified-gallery/1"}});
    if(!response.ok)throw Error("HTTP "+response.status);
    return Buffer.from(await response.arrayBuffer());
  }finally{clearTimeout(timeout);}
}
const [manifestBuffer,catalogBuffer]=await Promise.all([
  get(vaultRoot+"threejs-code/manifest.json"),
  get(vaultRoot+"threejs-code/catalog.json")
]);
const source=JSON.parse(manifestBuffer.toString("utf8"));
const catalog=JSON.parse(catalogBuffer.toString("utf8"));
if(source.provider!=="threejs"||
   !/^[a-f0-9]{40}$/.test(source.sourceCommit)||
   source.codeOnlyResources!==281||!Array.isArray(catalog.resources))
  throw Error("Original Three.js snapshot doesn't match the verified Vault.");
const allowed=[];
for(const row of catalog.resources){
  if(!/^threejs:example:[a-z0-9_-]+$/.test(row.id||""))continue;
  const name=row.id.slice("threejs:example:".length);
  if(row.source?.provider && row.source.provider!=="threejs")continue;
  if(!allowed.some(entry=>entry.name===name))allowed.push({name,id:row.id});
}
if(allowed.length<100)throw Error("The verified scene catalog is incomplete");
allowed.sort((a,b)=>a.name.localeCompare(b.name));
await rm(out,{recursive:true,force:true});
await mkdir(path.join(out,"screenshots"),{recursive:true});
const entries={},skipped=[];
const candidates=allowed.slice(0,cap);
let cursor=0;
const workers=Array.from({length:8},async()=>{
  while(cursor<candidates.length){
    const {id,name}=candidates[cursor++];
    const url="https://raw.githubusercontent.com/mrdoob/three.js/"+
      source.sourceCommit+"/examples/screenshots/"+name+".jpg";
    try{
      const bytes=await get(url);
      if(bytes.length<1800||bytes.length>1000000||
        bytes.subarray(0,3).toString("hex")!=="ffd8ff"||
        bytes.subarray(-2).toString("hex")!=="ffd9")
        throw Error("JPEG integrity check failed");
      const filename="screenshots/"+name+".jpg";
      await writeFile(path.join(out,filename),bytes);
      entries[id]={image:filename,sha256:createHash("sha256").update(bytes).digest("hex")};
    }catch(error){skipped.push({id,reason:String(error.message).slice(0,80)});}
  }
});
await Promise.all(workers);
if(Object.keys(entries).length<75)
  throw Error("Insufficient real source-matched Three.js screenshots: "+Object.keys(entries).length);
const output={format:"nagweb-threejs-source-gallery/1",sourceRepository:source.sourceRepository,
  sourceCommit:source.sourceCommit,images:Object.keys(entries).length,entries};
await writeFile(path.join(out,"manifest.json"),JSON.stringify(output,null,2)+"\n");
console.log("Verified source snapshots:",allowed.length,"scenes in Vault,",Object.keys(entries).length,
  "matching original JPEGs,",skipped.length,"missing.");
for(const failure of skipped.slice(0,8))console.log("No matching upstream image:",failure.id,failure.reason);
