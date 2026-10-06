import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),defaults=model.config({kind:'grid-reveal'});
assert.equal(defaults.gap,3);assert.equal(defaults.order,'row');
const expected={row:[0,1,2,3,4,5,6,7,8],column:[0,3,6,1,4,7,2,5,8],diagonal:[0,1,3,2,4,6,5,7,8]};
for(const order of Object.keys(expected)){
 const cfg={kind:'grid-reveal',order,frameRatio:'auto'},cards=model.layout(1280,720,cfg,.5,9),sequence=[...cards].sort((a,b)=>a.revealRank-b.revealRank).map(n=>n.slot);assert.deepEqual(plain(sequence),expected[order]);
 const first=model.layout(1280,720,cfg,.01,9),last=model.layout(1280,720,cfg,.66,9);assert.deepEqual(plain(first.filter(n=>n.alpha>0).map(n=>n.slot)),[sequence[0]]);assert.deepEqual(plain(last.filter(n=>n.alpha<1).map(n=>n.slot)),[sequence.at(-1)],'Exit reverses the appearance order');
}
for(const count of [2,3,4,5,7,9])for(const order of Object.keys(expected))for(const [width,height] of [[1280,720],[390,844]])for(const frameRatio of ['auto','16:9','9:16']){
 const cfg={kind:'grid-reveal',order,frameRatio},pose=p=>plain(model.layout(width,height,cfg,p,count)),start=pose(0),hold=pose(.5);
 assert.equal(start.length,count);assert.deepEqual(start,pose(1),'The complete cycle closes without a jump');assert.ok(start.every(n=>n.alpha===0&&!n.visible));assert.ok(hold.every(n=>n.alpha===1&&n.scale===1&&n.visible));assert.deepEqual(hold,pose(.4),'The assembled grid holds still');
 const seen=new Set();for(let sample=0;sample<100;sample++)for(const n of pose(sample/100)){
  assert.ok(n.alpha>=0&&n.alpha<=1&&n.scale>=.7&&n.scale<=1);if(n.alpha===1)seen.add(n.slot);assert.deepEqual([n.textureWidth,n.textureHeight,n.corner],[start[n.slot].textureWidth,start[n.slot].textureHeight,start[n.slot].corner],'Each tile reuses a stable texture');
  for(const p of n.upper.concat(n.lower)){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(p.x>=n.clip.left-1e-7&&p.x<=n.clip.left+n.clip.width+1e-7&&p.y>=n.clip.top-1e-7&&p.y<=n.clip.top+n.clip.height+1e-7);}
 }
 assert.equal(seen.size,count);const a=pose(.127),b=plain(model.layout(width*2,height*2,cfg,.127,count));for(let i=0;i<count;i++)for(const side of ['upper','lower'])a[i][side].forEach((p,j)=>{for(const key of ['x','y'])assert.ok(Math.abs(b[i][side][j][key]-2*p[key])<1e-7);});
 for(const p of [.07,.15,.28]){const entry=pose(p),exit=pose(1-p);for(let i=0;i<count;i++){assert.ok(Math.abs(entry[i].alpha-exit[i].alpha)<1e-7);}}
}
assert.notDeepEqual(plain(model.layout(1280,720,{...defaults,gap:0},.5,4)),plain(model.layout(1280,720,{...defaults,gap:10},.5,4)));
assert.equal(model.config({kind:'grid-reveal',order:'invalid',gap:999}).order,'row');assert.equal(model.config({kind:'grid-reveal',gap:999}).gap,10);
assert.equal(model.layout(1280,720,defaults,0,1).length,2);assert.equal(model.layout(1280,720,defaults,0,100).length,9);
const scroll={...defaults,order:'diagonal',turns:3,start:20,end:80};assert.equal(model.phase(.5,scroll,true),1.5);assert.deepEqual(plain(model.layout(1280,720,scroll,.1,9,1,true)),plain(model.layout(1280,720,scroll,.9,9,1,true)));
const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,9,1,true)),plain(model.layout(390,844,scroll,.317,9,1,true)));
console.log('Grid Reveal: 2–9 tiles, row/column/diagonal appearance, assembled hold, reverse exit, closed cycle, stable textures, responsive geometry, gap, scroll and exported factory OK');
