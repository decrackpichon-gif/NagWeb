import path from "node:path";
import { createHash } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";
import { mkdir, readFile, writeFile } from "node:fs/promises";

// Split only Uiverse; retain the canonical provider archive unchanged.
// Each shard contains complete, independently checksum-verifiable records.
const SHA = bytes => createHash("sha256").update(bytes).digest("hex");
export const UIVERSE_SHARD_COUNT = 8;
export const uiverseBucket = id => createHash("sha256").update(String(id)).digest()[0] % UIVERSE_SHARD_COUNT;

export async function buildUiverseShards(root) {
  const manifestPath = path.join(root, "vault-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const provider = manifest.snapshots?.find(s => s.id === "uiverse");
  if (!provider || !/^[a-f0-9]{64}$/i.test(provider.sha256 || "") ||
      !provider.libraryPath || provider.count < UIVERSE_SHARD_COUNT) {
    throw new Error("Uiverse source snapshot is missing or invalid");
  }
  const archive = await readFile(path.join(root, provider.libraryPath));
  if (SHA(archive) !== provider.sha256) throw new Error("Uiverse source SHA-256 mismatch");
  const source = JSON.parse(gunzipSync(archive).toString("utf8"));
  if (source.format !== "nagweb-provider-snapshot" ||
      !Array.isArray(source.resources) || source.resources.length !== provider.count) {
    throw new Error("Unexpected Uiverse source schema or resource count");
  }
  const seen = new Set();
  const buckets = Array.from({length:UIVERSE_SHARD_COUNT},() => []);
  for (const resource of source.resources) {
    if (!resource?.id || resource.source?.provider !== "uiverse" || seen.has(resource.id)) {
      throw new Error("Duplicate/invalid resource in canonical Uiverse snapshot");
    }
    seen.add(resource.id);
    buckets[uiverseBucket(resource.id)].push(resource);
  }
  const folder = path.join(root, "uiverse", "shards");
  await mkdir(folder, {recursive:true});
  const shards = [];
  for (let i = 0; i < UIVERSE_SHARD_COUNT; i++) {
    const resources = buckets[i];
    if (resources.length < 1) throw new Error("Empty Uiverse shard: " + i);
    const name = "part-" + i.toString().padStart(2,"0") + ".json.gz";
    const contents = gzipSync(Buffer.from(JSON.stringify({
      format:"nagweb-provider-shard", version:"1.0", sourceSnapshot:"uiverse",
      sourceSha256:provider.sha256, shard:i, count:resources.length, resources
    })), {level:9});
    await writeFile(path.join(folder,name),contents);
    shards.push({id:"uiverse-part-"+i, shard:i, sourceSnapshot:"uiverse",
      libraryPath:"uiverse/shards/"+name,count:resources.length,sha256:SHA(contents),
      compressedBytes:contents.length});
  }
  if (shards.reduce((sum,s)=>sum+s.count,0) !== provider.count) {
    throw new Error("Sharded Uiverse count mismatch");
  }
  manifest.detailShards = {...manifest.detailShards, uiverse: {
    algorithm:"sha256-first-byte-mod-8", sourceSha256:provider.sha256, shards
  }};
  await writeFile(manifestPath,JSON.stringify(manifest,null,2)+"\n","utf8");
  return {originalCount:provider.count,shards};
}

const invoked = process.argv[1]?.endsWith("/build-uiverse-shards.mjs") ||
  process.argv[1]?.endsWith("\\build-uiverse-shards.mjs");
if (invoked) {
  const arg=process.argv.find(x=>x.startsWith("--root="));
  if(!arg)throw new Error("--root=/absolute/vault/path is required");
  const result=await buildUiverseShards(path.resolve(arg.slice(7)));
  console.log("Uiverse resource shards:",result.originalCount,"resources,",
    result.shards.length,"checksum-verified shards");
  for(const shard of result.shards)
    console.log(shard.id,shard.count,shard.compressedBytes,shard.sha256);
}
