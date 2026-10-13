import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { createNagWebPersistentVaultClient } from "./runtime/persistent-vault-client.mjs";

const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const zip = obj => gzipSync(Buffer.from(JSON.stringify(obj)));
const make = (name,version) => {
  const id=name==="core-code" ? "magicui:button" : name+":icon";
  const resource={id,title:version,source:{provider:name==="core-code"?"magicui":name}};
  const content=zip({format:name==="core-code"?"nagweb-code-library":"nagweb-provider-snapshot",
    provider:name,count:1,resources:[resource]});
  return {resource,content,snapshot:{id:name,count:1,libraryPath:name+"-"+version+".gz",sha256:hash(content)}};
};
function state(version) {
  const providers=[make("lucide",version),make("core-code",version)];
  const index=zip({format:"nagweb-resource-browse-index",resourceCount:2,
    resources:providers.map(x=>({id:x.resource.id,title:x.resource.title,
      provider:x.resource.source.provider,snapshotId:x.snapshot.id}))});
  const library=zip({format:"nagweb-resource-vault-bundle",resourceCount:2,
    resources:providers.map(x=>x.resource)});
  return {manifest:{format:"nagweb-resource-vault-index",
    snapshots:providers.map(x=>x.snapshot),
    consolidated:{count:2,browseIndexPath:"browse-"+version+".gz",
      browseIndexSha256:hash(index),libraryPath:"full-"+version+".gz",
      sha256:hash(library)}},
    files:Object.fromEntries([...providers.map(x=>[x.snapshot.libraryPath,x.content]),
      ["browse-"+version+".gz",index],["full-"+version+".gz",library]])};
}
const old=state("old"), fresh=state("fresh");
let live=old,corruptProvider=false,corruptIndex=false,reads=[];
const fetchImpl=async url=>{
  const name=new URL(url).pathname.split("/").at(-1);
  reads.push(name);
  if(name==="vault-manifest.json")return new Response(JSON.stringify(live.manifest));
  const bytes=live.files[name];
  if(!bytes)return new Response("missing",{status:404});
  if(corruptProvider && name.startsWith("lucide-"))return new Response("broken gzip");
  if(corruptIndex && name.startsWith("browse-"))return new Response("broken index");
  return new Response(bytes);
};
const vault=createNagWebPersistentVaultClient({baseUrl:"https://vault.invalid",fetchImpl});
const [lucide, core]=await Promise.all([vault.getResource("lucide:icon"),vault.getResource("magicui:button")]);
assert.equal(lucide?.title,"old");
assert.equal(core?.title,"old");
assert.equal(reads.includes("full-old.gz"),false,"Opening a detail cannot download all 6762 resources");
assert.equal(reads.filter(x=>x==="lucide-old.gz").length,1);
assert.equal(reads.filter(x=>x==="core-code-old.gz").length,1,
  "The index resolves a provider nested in the core-code snapshot");
await vault.getResource("lucide:icon");
assert.equal(reads.filter(x=>x==="lucide-old.gz").length,1,"Reuse a verified provider archive");

live=fresh;
await vault.refreshBrowseIndex();
assert.equal((await vault.getResource("lucide:icon"))?.title,"fresh");
assert.equal(reads.filter(x=>x==="lucide-fresh.gz").length,1,"Changed provider checksum invalidates cache");
await vault.refreshBrowseIndex();
await vault.getResource("lucide:icon");
assert.equal(reads.filter(x=>x==="lucide-fresh.gz").length,1,"Unchanged snapshots remain cached");

live=old; corruptIndex=true;
await assert.rejects(vault.refreshBrowseIndex(),/checksum mismatch/);
assert.equal((await vault.getResource("lucide:icon"))?.title,"fresh",
  "An unverified index does not replace the verified cache");
corruptIndex=false;
await vault.refreshBrowseIndex();
assert.equal((await vault.getResource("lucide:icon"))?.title,"old");

vault.clearMemoryCache();
corruptProvider=true;
await assert.rejects(vault.getResource("lucide:icon"),/checksum mismatch/);
assert.equal(vault.providerSnapshots.size,0,"Never cache unverified provider content");
corruptProvider=false;
assert.equal((await vault.getResource("lucide:icon"))?.title,"old",
  "A fixed checksum enables normal recovery");
assert.equal(await vault.getResource("missing"),null);

const legacy=state("legacy");
legacy.manifest.snapshots=[];
const uncompressed=JSON.parse(Buffer.from(
  (await import("node:zlib")).gunzipSync(legacy.files["browse-legacy.gz"])).toString("utf8"));
for (const r of uncompressed.resources) delete r.snapshotId;
legacy.files["browse-legacy.gz"]=zip(uncompressed);
legacy.manifest.consolidated.browseIndexSha256=hash(legacy.files["browse-legacy.gz"]);
const older=createNagWebPersistentVaultClient({baseUrl:"https://vault.invalid",
  fetchImpl:async url=>{
    const name=new URL(url).pathname.split("/").at(-1);
    const bytes=name==="vault-manifest.json"?JSON.stringify(legacy.manifest):legacy.files[name];
    return bytes?new Response(bytes):new Response("missing",{status:404});
  }});
assert.equal((await older.getResource("lucide:icon"))?.title,"legacy",
  "Legacy index uses full bundle for backwards compatibility");
assert.equal(older.fullLibrary?.resourceCount,2);
console.log("NagWeb Vault provider-on-demand detail loading, per-provider checksums, caching, atomic refresh, recovery and legacy fallback OK.");
