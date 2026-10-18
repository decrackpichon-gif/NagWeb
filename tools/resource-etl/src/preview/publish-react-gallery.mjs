// Compile step runs in GitHub Actions with the EXISTING licensed React compiler.
// Only successfully rendered, audited bundles are published alongside the
// standalone Library. Nothing needs installing on the user's Windows machine.
import { readFile, writeFile, mkdir, copyFile, rm } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { chromium } from "playwright";

function argument(name) {
  const arg=process.argv.slice(2).find(value=>value.startsWith("--"+name+"="));
  return arg?.slice(name.length+3);
}
const base=path.resolve(argument("vault")||"react-gallery-build");
const out=path.resolve(argument("out")||"resource-browser/react-previews");
const counts={"magicui":6,"shadcn":6,"motion-primitives":4};
const safeId=id=>/^(?:magicui|shadcn|motion-primitives):[a-z0-9_-]+$/.test(id);
const sha=bytes=>createHash("sha256").update(bytes).digest("hex");
const catalog=JSON.parse(await readFile(path.join(base,"catalog.json"),"utf8"));
const eligible=(catalog.resources||[]).filter(row=>{
  if(!safeId(row.id)||row.previewStatus!=="ready-react")return false;
  if(!/^previews\/react\/[a-z0-9._-]+\.html$/.test(row.previewPath||""))return false;
  return true;
});
const audit=JSON.parse(await readFile(path.join(base,"react-preview-audit.json"),"utf8"));
const passed=new Set((audit.items||[]).filter(row=>row.ok).map(row=>row.resourceId));
const selected=[];
for(const row of eligible){
  const provider=row.id.split(":")[0];
  if(!passed.has(row.id)||!counts[provider])continue;
  counts[provider]--;
  selected.push(row);
}
if(selected.length<5 || !selected.some(r=>r.id.startsWith("magicui:")) ||
  !selected.some(r=>r.id.startsWith("shadcn:")))
  throw Error("Not enough real, audited React previews; refusing a gallery of placeholders.");
await rm(out,{recursive:true,force:true});
for(const name of ["react","runtime","thumbnails"])await mkdir(path.join(out,name),{recursive:true});
const runtimeJs=await readFile(path.join(base,"previews/runtime/tailwindcss-browser.js"),"utf8");
const inlineScript=text=>"<script>"+text.replace(/<\/script/gi,"<\\/script")+"</script>";
// An opaque iframe cannot load sibling <script src> files under CSP 'self'.
// Inline *only* the already audited, compiled JS and the local Tailwind runtime.
// This is an autonomous offline HTML preview with no external script requests.
for(const row of selected){
  const htmlName=path.basename(row.previewPath);
  const jsName=htmlName.replace(/\.html$/,".js");
  const orig=await readFile(path.join(base,row.previewPath),"utf8");
  const bundle=await readFile(path.join(base,"previews/react",jsName),"utf8");
  const tailwindTag='<script src="../runtime/tailwindcss-browser.js"></script>';
  const bundleTag='<script src="./'+jsName+'"></script>';
  if(!orig.includes(tailwindTag)||!orig.includes(bundleTag))
    throw Error("Unexpected compiled React HTML structure: "+row.id);
  const standalone=orig.replace(tailwindTag,inlineScript(runtimeJs))
    .replace(bundleTag,inlineScript(bundle));
  // The inlined audited runtime itself can contain HTML tag strings.
  // Requiring both original tags above plus the real sandbox render below
  // is more reliable than searching for those strings inside bundle source.
  await writeFile(path.join(out,"react",htmlName),standalone,"utf8");
}
// The screenshot runs against a real HTTP server and the same opaque iframe
// sandbox used in NagWeb. A blank React mount NEVER qualifies as a thumbnail.
const server=http.createServer(async(req,res)=>{
  let file;
  try{
    const url=new URL(req.url,"http://localhost");
    const segments=decodeURIComponent(url.pathname).split("/").filter(Boolean);
    if(segments.some(s=>s.startsWith(".")||s===".."))throw Error("Bad path");
    file=path.resolve(out,...segments);
    if(!file.startsWith(out+path.sep))throw Error("Bad path");
    const bytes=await readFile(file);
    res.writeHead(200,{"Content-Type":file.endsWith(".html")?"text/html; charset=utf-8":
      file.endsWith(".js")?"text/javascript; charset=utf-8":"application/octet-stream"});
    res.end(bytes);
  }catch{res.writeHead(404);res.end("Not found");}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
const entries={};
try{
  for(const row of selected){
    const id=row.id,name=path.basename(row.previewPath);
    const safeBase=id.replace(/[^a-z0-9._-]+/gi,"__");
    const page=await browser.newPage({viewport:{width:700,height:490},deviceScaleFactor:1});
    const browserErrors=[];
    page.on("pageerror",error=>browserErrors.push(error.message));
    page.on("console",message=>{
      if(message.type()==="error")browserErrors.push(message.text());
    });
    try{
      await page.route("**/*",route=>{
        if(new URL(route.request().url()).origin===origin)return route.continue();
        return route.abort();
      });
      await page.setContent('<html><body style="margin:0">'+
        '<iframe title="Vista React verificada" sandbox="allow-scripts" style="width:680px;height:460px;border:0" src="'+
        origin+'/react/'+name+'"></iframe></body></html>');
      const frame=page.frameLocator('iframe[title="Vista React verificada"]');
      const stage=frame.locator("#nagweb-preview-stage");
      await stage.waitFor({state:"visible",timeout:8000});
      await page.waitForFunction(()=>{
        const iframe=document.querySelector("iframe");
        try{return !!iframe?.contentDocument?.querySelector("#nagweb-preview-stage > *")}
        catch{return true;} // sandboxed iframe: use Playwright's frame locator below
      },{timeout:1000}).catch(()=>{});
      await stage.locator(":scope > *").first().waitFor({state:"visible",timeout:8000});
      // Give the offline Tailwind browser compiler time to finish styling.
      await page.waitForTimeout(800);
      const content=await stage.innerText();
      if(content.includes("Preview recipe references missing export") || content.includes("Cannot read properties"))
        throw Error("React recipe failed to render the actual export");
      const rect=await stage.boundingBox();
      if(!rect||rect.width<100||rect.height<80)throw Error("React stage is empty");
      const image="thumbnails/"+safeBase+".png";
      await stage.screenshot({path:path.join(out,image),animations:"allow",timeout:10000});
      const bytes=await readFile(path.join(out,image));
      if(bytes.length<1000)throw Error("Rendered thumbnail unexpectedly empty");
      entries[id]={html:"react/"+name,thumbnail:image,
        pngSha256:sha(bytes)};
      console.log("Real React preview:",id,"PNG",bytes.length,"bytes");
    }catch(e){
      console.log("Deferred React rendering:",id,String(e.message).slice(0,250),"browser errors:",browserErrors.slice(-3));
    }finally{await page.close();}
  }
}finally{await browser.close();await new Promise(ok=>server.close(ok));}
if(Object.keys(entries).length<5)throw Error("Fewer than five React previews rendered in the real opaque sandbox");
const keep=new Set(Object.values(entries).map(e=>path.basename(e.html)));
for(const row of selected) {
  const name=path.basename(row.previewPath);
  if(keep.has(name))continue;
  await rm(path.join(out,"react",name),{force:true});
  await rm(path.join(out,"react",name.replace(/\.html$/,".js")),{force:true});
}
const manifest={format:"nagweb-compiled-react-gallery/1",entries};
await writeFile(path.join(out,"manifest.json"),JSON.stringify(manifest,null,2)+"\n","utf8");
console.log("Published audited, actually rendered React previews:",Object.keys(entries).length);
