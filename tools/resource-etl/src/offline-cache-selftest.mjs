import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { createNagWebPersistentVaultClient } from "./runtime/persistent-vault-client.mjs";
import { OfflineVaultCache } from "./runtime/offline-vault-cache.mjs";

const sha=bytes=>createHash("sha256").update(bytes).digest("hex");
const gz=data=>gzipSync(JSON.stringify(data));
class FakeCache {
  entries=new Map();
  async put(url,response){this.entries.set(String(url),response.clone());}
  async match(url){return this.entries.get(String(url))?.clone();}
  async keys(){return [...this.entries.keys()].map(url=>({url}));}
  async delete(req){return this.entries.delete(req.url);}
}
class FakeCacheStorage {
  data=new Map();
  async open(name){if(!this.data.has(name))this.data.set(name,new FakeCache());return this.data.get(name);}
}
const storage=new FakeCacheStorage();
const baseUrl="https://vault.invalid/data";
const fixtures=version=>{
  const ids=["lucide:camera","uiverse:button","magicui:card"];
  const categories=["lucide","uiverse","core-code"];
  const snapshots=ids.map((id,i)=>{
    const resource={id,source:{provider:categories[i]},title:version+" "+id};
    const content=gz({format:i===2?"nagweb-code-library":"nagweb-provider-snapshot",
      count:1,resources:[resource]});
    const file=categories[i]+"/"+version+".gz";
    return {id:categories[i],count:1,libraryPath:file,sha256:sha(content),body:content,resource};
  });
  const index=gz({format:"nagweb-resource-browse-index",resourceCount:3,
    resources:snapshots.map(s=>({id:s.resource.id,title:s.resource.title,
      provider:s.id,snapshotId:s.id}))});
  const all=gz({format:"nagweb-resource-vault-bundle",resourceCount:3,
    resources:snapshots.map(s=>s.resource)});
  const manifest={format:"nagweb-resource-vault-index",
    snapshots:snapshots.map(({body,resource,...s})=>s),
    consolidated:{count:3,browseIndexPath:"all/browse-"+version+".gz",
      browseIndexSha256:sha(index),libraryPath:"all/library-"+version+".gz",
      sha256:sha(all)}};
  const files=new Map([...snapshots.map(s=>[s.libraryPath,s.body]),
    [manifest.consolidated.browseIndexPath,index],
    [manifest.consolidated.libraryPath,all]]);
  return {manifest,files};
};
const old=fixtures("v1"),newer=fixtures("v2");
let live=old,online=true,corruptIndex=false,requests=[];
const fetchImpl=async url=>{
  const name=decodeURIComponent(new URL(url).pathname.slice("/data/".length));
  requests.push(name);
  if(!online)throw new Error("offline network");
  if(name==="vault-manifest.json")return new Response(JSON.stringify(live.manifest));
  const bytes=live.files.get(name);
  if(!bytes)return new Response("missing",{status:404});
  return new Response(corruptIndex && name.startsWith("all/browse") ? Buffer.from("bad") : bytes);
};
const make=()=>createNagWebPersistentVaultClient({baseUrl,fetchImpl,cacheStorage:storage});
const first=make();
await first.loadBrowseIndex();
await Promise.all([first.getResource("lucide:camera"),first.getResource("uiverse:button")]);
assert.equal(requests.includes("all/library-v1.gz"),false);
const cache=await storage.open("nagweb-resource-vault-verified-v1");
assert.equal(cache.entries.size,4,"Index+manifest+two provider archives saved across sessions");

online=false;
const reopened=make();
const result=await reopened.search({query:"camera"});
assert.equal(result.total,1,"Search works offline in fresh client instance");
assert.equal(reopened.lastBrowseUsedOfflineCache,true);
assert.equal((await reopened.getResource("lucide:camera")).title,"v1 lucide:camera");
assert.equal((await reopened.getResource("uiverse:button")).title,"v1 uiverse:button");
await assert.rejects(reopened.getResource("magicui:card"),/offline network/,
  "Never present unvisited resources as available offline");
assert.equal(await reopened.getResource("does:not-exist"),null);
assert.equal(requests.includes("all/library-v1.gz"),false);

online=true;live=newer;corruptIndex=true;
await assert.rejects(first.refreshBrowseIndex(),/checksum mismatch/);
online=false;
const afterRejected=make();
assert.equal((await afterRejected.search({query:"v1"})).total,3,
  "Bad network response must not overwrite last verified offline index");

online=true;corruptIndex=false;
await first.refreshBrowseIndex();
assert.equal((await first.getResource("lucide:camera")).title,"v2 lucide:camera");
online=false;
const latest=make();
assert.equal((await latest.getResource("lucide:camera")).title,"v2 lucide:camera",
  "Manifest and matching SHA256 archive survive a browser restart");
await assert.rejects(latest.getResource("uiverse:button"),/offline network/,
  "Never mix an old cached provider archive with a new manifest checksum");

const stored=[...cache.entries.entries()].find(([k])=>k.includes("/lucide/v2.gz?"))[0];
cache.entries.set(stored,new Response(Buffer.from([1,2,3])));
const tampered=make();
await assert.rejects(tampered.getResource("lucide:camera"),/checksum mismatch/,
  "Revalidate SHA-256 of cached bytes, even though their URL embeds a hash");

online=true;
const disabled=createNagWebPersistentVaultClient({baseUrl,fetchImpl,
  cacheStorage:{open:async()=>{throw new Error("cache disabled")}}});
assert.equal((await disabled.getResource("lucide:camera")).title,"v2 lucide:camera",
  "Disabled browser Cache Storage must not break online browsing");

const limiter=new OfflineVaultCache(baseUrl,storage);
for(let n=0;n<55;n++) {
  const content=new TextEncoder().encode("chunk "+n);
  await limiter.saveVerified("dummy/"+n+".gz",sha(content),content);
}
assert.ok((await cache.keys()).filter(k=>k.url.includes("nagweb_sha256=")).length<=48,
  "Offline archive cache is bounded");
assert.ok(await limiter.readManifest(),"Bounded cache must retain its manifest");
console.log("Verified persistent offline Vault across browser restarts: search, shards, atomic refresh, SHA corruption, quota fallback and bounded storage OK.");
