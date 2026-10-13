import assert from "node:assert/strict";
import path from "node:path";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildUiverseShards, uiverseBucket } from "./snapshot/build-uiverse-shards.mjs";
import { createNagWebPersistentVaultClient } from "./runtime/persistent-vault-client.mjs";

const sha = bytes=>createHash("sha256").update(bytes).digest("hex");
const root=await mkdtemp(path.join(tmpdir(),"nw-uiverse-shards-"));
try {
  await mkdir(path.join(root,"uiverse"),{recursive:true});
  const records=Array.from({length:120},(_,i)=>({
    id:"uiverse:component-"+i,source:{provider:"uiverse"},
    title:"Component "+i,artifacts:[{role:"component",content:"<button>Hello "+i+"</button>"}]
  }));
  const canonical=gzipSync(Buffer.from(JSON.stringify({
    format:"nagweb-provider-snapshot",count:records.length,resources:records
  })));
  await writeFile(path.join(root,"uiverse/library.json.gz"),canonical);
  await writeFile(path.join(root,"README.md"),"# Test Vault\n");
  await writeFile(path.join(root,"vault-manifest.json"),JSON.stringify({
    format:"nagweb-resource-vault-index",totalResources:records.length,
    snapshots:[{id:"uiverse",count:records.length,libraryPath:"uiverse/library.json.gz",sha256:sha(canonical)}]
  }));
  const result=await buildUiverseShards(root);
  assert.equal(result.originalCount,120);
  assert.equal(result.shards.length,8);
  assert.equal(result.shards.reduce((n,x)=>n+x.count,0),120);
  assert.ok(result.shards.every(x=>x.count>0 && x.count<120));
  execFileSync(process.execPath,[fileURLToPath(new URL("./snapshot/build-consolidated-vault.mjs",import.meta.url)),"--root="+root]);
  const saved=JSON.parse(await readFile(path.join(root,"vault-manifest.json"),"utf8"));
  assert.equal(saved.detailShards.uiverse.shards.length,8);
  const index=JSON.parse(gunzipSync(await readFile(path.join(root,saved.consolidated.browseIndexPath))));
  assert.equal(index.resources.length,120);
  for(const entry of index.resources)
    assert.equal(entry.detailShard,uiverseBucket(entry.id),"Every index entry must route to its own shard");

  const counts=new Map();
  let corrupt="";
  const client=createNagWebPersistentVaultClient({baseUrl:"https://vault.invalid",
    fetchImpl:async url=>{
      const relative=decodeURIComponent(new URL(url).pathname.slice(1));
      counts.set(relative,(counts.get(relative)||0)+1);
      try {
        const bytes=await readFile(path.join(root,relative));
        return new Response(corrupt === relative ? new Uint8Array([1,2,3]) : bytes);
      } catch {return new Response("missing",{status:404})}
    }
  });
  const a=records[0],same=records.find(r=>uiverseBucket(r.id)===uiverseBucket(a.id)&&r.id!==a.id);
  const other=records.find(r=>uiverseBucket(r.id)!==uiverseBucket(a.id));
  assert.ok(same && other);
  const [opened,second]=await Promise.all([client.getResource(a.id),client.getResource(same.id)]);
  assert.equal(opened.id,a.id);
  assert.equal(second.id,same.id);
  assert.equal((await client.getResource(other.id)).id,other.id);
  assert.equal(counts.has("uiverse/library.json.gz"),false,"Detail load must not use the 2.9 MB full provider archive");
  assert.equal(counts.has("all/library.json.gz"),false,"Detail load must not use the 4.7 MB consolidated archive");
  const shardA=saved.detailShards.uiverse.shards[uiverseBucket(a.id)];
  assert.equal(counts.get(shardA.libraryPath),1,"Concurrent details reuse one shard fetch");
  await client.getResource(a.id);
  assert.equal(counts.get(shardA.libraryPath),1,"The shard is cached after verification");

  client.clearMemoryCache();
  corrupt=shardA.libraryPath;
  await assert.rejects(client.getResource(a.id),/checksum mismatch/);
  assert.equal(client.providerSnapshots.size,0,"Corrupt shard must not be cached");
  corrupt="";
  assert.equal((await client.getResource(a.id)).id,a.id);
  const beforeManifest=client.manifest;
  await client.refreshBrowseIndex();
  assert.equal(client.manifest.detailShards.uiverse.shards.length,8);
  assert.notEqual(client.manifest,beforeManifest);
  await client.getResource(a.id);
  assert.equal(counts.get(shardA.libraryPath),3,"Index refresh preserves verified unchanged shard");

  console.log("Uiverse 8 shard build, 120 routed resources, SHA integrity, concurrency, cache and recovery OK.");
} finally {await rm(root,{recursive:true,force:true})}
