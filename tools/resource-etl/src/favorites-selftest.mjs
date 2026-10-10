import assert from "node:assert/strict";
import { FAVORITES_KEY, MAX_FAVORITES, getOptionalStorage, readFavorites, toggleFavorite, saveFavorites } from "./runtime/favorites.mjs";
import { NagWebPersistentVaultClient } from "./runtime/persistent-vault-client.mjs";

const storage = {
  records: new Map(),
  getItem(key) { return this.records.get(key) || null; },
  setItem(key,value) { this.records.set(key,value); }
};
assert.deepEqual([...readFavorites(storage)],[]);
assert.equal(getOptionalStorage({localStorage:storage}),storage);
assert.equal(getOptionalStorage({get localStorage(){throw Error("SecurityError");}}),null,
  "A forbidden localStorage getter cannot crash the browser");
assert.deepEqual([...readFavorites(null)],[]);
assert.equal(saveFavorites(null,new Set(["smoke:icon"])),false,
  "Unavailable localStorage must not be reported as persisted");
assert.equal(saveFavorites({},new Set(["smoke:icon"])),false,
  "Missing setItem must not be treated as success");
let favorites=toggleFavorite(readFavorites(storage),"smoke:icon");
assert.deepEqual([...favorites],["smoke:icon"]);
assert.equal(saveFavorites(storage,favorites),true);
assert.deepEqual([...readFavorites(storage)],["smoke:icon"]);
assert.ok(storage.records.has(FAVORITES_KEY));
favorites=toggleFavorite(favorites,"smoke:icon");
assert.equal(favorites.size,0,"Toggling again unstars the resource");
favorites=toggleFavorite(favorites,"safe:resource");
favorites=toggleFavorite(favorites,"<script>alert(1)</script>");
assert.deepEqual([...favorites],["safe:resource"],
  "Markup and untrusted identifiers cannot enter favorites");
storage.records.set(FAVORITES_KEY,"broken JSON!");
assert.deepEqual([...readFavorites(storage)],[],
  "Corrupt local browser storage cannot block the resource library");
storage.records.set(FAVORITES_KEY,JSON.stringify(["smoke:icon","smoke:icon",123,
  "<script>","another:asset"]));
assert.deepEqual([...readFavorites(storage)],["smoke:icon","another:asset"],
  "Favorite collection deduplicates and validates identifiers");
favorites=new Set(Array.from({length:MAX_FAVORITES},(_,i)=>"icon:"+i));
assert.equal(toggleFavorite(favorites,"extra:icon").size,MAX_FAVORITES,
  "Too many favorites must not exhaust browser storage");
assert.equal(toggleFavorite(favorites,"icon:7").size,MAX_FAVORITES-1,
  "Users can remove an item even at capacity");
assert.equal(saveFavorites({
  setItem() { throw new Error("QuotaExceeded"); }
},favorites),false,"Storage failures are reported rather than claimed saved");

const client=new NagWebPersistentVaultClient({
  fetchImpl:async()=>{throw Error("Search must not download files");}
});
client.browseIndex={format:"nagweb-resource-browse-index",resourceCount:3,
  resources:[
    {id:"smoke:icon",title:"Icon",provider:"smoke",family:"icon"},
    {id:"uiverse:button",title:"Button",provider:"uiverse",family:"ui"},
    {id:"lucide:star",title:"Star",provider:"lucide",family:"icon"}
  ]};
const all=await client.search({limit:1});
assert.equal(all.total,3);
assert.deepEqual(all.items.map(x=>x.id),["smoke:icon"]);
const picked=await client.search({ids:["smoke:icon","lucide:star"],limit:1});
assert.equal(picked.total,2);
assert.equal(picked.hasMore,true);
assert.deepEqual((await client.search({
  ids:["smoke:icon","lucide:star"],offset:1,limit:1
})).items.map(x=>x.id),["lucide:star"]);
const none=await client.search({ids:[],limit:50});
assert.deepEqual([none.total,none.items.length],[0,0]);
assert.equal((await client.search({ids:["smoke:icon"],providers:"uiverse"})).total,0,
  "Favorites filtering intersects provider and other existing filters");
assert.equal((await client.search({ids:["smoke:icon"],query:"icon"})).total,1);
assert.equal((await client.search({ids:["lucide:star"],query:"button"})).total,0,
  "Favorite filtering works alongside search text");
