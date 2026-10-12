import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,cfg=model.config({kind:'grid-dive',backgroundType:'none',cardRatio:'16:9'}),plain=x=>JSON.parse(JSON.stringify(x));
assert.equal(cfg.kind,'grid-dive');assert.equal(cfg.columns,3);assert.equal(cfg.diveZoom,2.7);
for(const [key,s] of Object.entries(model.gridDiveSpecs)){assert.equal(cfg[key],s[0]);assert.equal(model.config({...cfg,[key]:-999})[key],s[1]);assert.equal(model.config({...cfg,[key]:999})[key],s[2]);}
assert.equal(model.config({...cfg,columns:3.7}).columns,4);
for(const n of [4,9,12,24])for(const [w,h] of [[1280,720],[720,1280]]){
 const pose=p=>model.layout(w,h,cfg,p,n,16/9),first=pose(0),last=pose(1);assert.equal(first.length,n);assert.deepEqual(plain(first),plain(last),'continuous loop seam');
 for(const t of [0,.03,.07,.22,.45,.78,.999]){
  const cards=pose(t);assert.equal(cards.length,n);assert.ok(cards.some(card=>card.instances.length));for(const card of cards){assert.ok([card.left,card.top,card.width,card.height,card.textureWidth,card.textureHeight].every(Number.isFinite));for(const x of card.instances){assert.ok(x.mesh&&x.homography);for(const pt of x.mesh.vertices){const inv=model.projectPlane(x.homography.inverse,pt.x,pt.y);assert.ok(Math.abs(inv.x-pt.u*x.mesh.width)<1e-5);assert.ok(Math.abs(inv.y-pt.v*x.mesh.height)<1e-5);}}}
 }
}
assert.ok(model.layout(1280,720,{...cfg,start:20,end:80},.5,12,16/9,true).some(card=>card.instances.length));
console.log('Grid Dive model: loop, geometry, clipping, transform and responsive cases OK');