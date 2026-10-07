import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),defaults=model.config({kind:'poster-burst'}),pose=(p,c={},n=4,w=1280,h=720)=>plain(model.layout(w,h,{...defaults,...c},p,n));
assert.equal(defaults.flow,'sequential');assert.equal(defaults.hold,30);assert.equal(defaults.overlap,60);assert.equal(defaults.groupSize,3);assert.equal(defaults.cardRatio,'1:1');assert.equal(model.config({kind:'poster-burst',cardRatio:'frame'}).cardRatio,'frame');assert.equal(model.config({kind:'poster-burst',groupSize:3.6}).groupSize,4);assert.equal(model.config({kind:'poster-burst',flow:'unknown'}).flow,'sequential');
for(const [key,s] of Object.entries(model.burstSpecs)){assert.equal(model.config({kind:'poster-burst',[key]:999})[key],s[2]);assert.equal(model.config({kind:'poster-burst',[key]:-999})[key],s[1]);}
for(const n of [2,4,7,10])for(const flow of ['sequential','staggered','volley'])for(const cardRatio of ['auto','frame','1:1','9:16','16:9'])for(const [w,h] of [[1280,720],[390,844]]){
 const c={flow,cardRatio,frameRatio:'auto'},start=pose(0,c,n,w,h),bySlot=new Map(start.map(card=>[card.slot,card])),seen=new Set();assert.deepEqual(start,pose(1,c,n,w,h));
 for(let sample=0;sample<64;sample++){
  const cards=pose(sample/64,c,n,w,h),visible=cards.filter(c=>c.visible),full=visible.filter(c=>c.scale===1);assert.ok(full.length===1,JSON.stringify({n,flow,cardRatio,w,h,sample,cards:cards.map(c=>[c.slot,c.scale,c.visible,c.age])}));
  for(const card of cards){assert.ok(card.scale>=0&&card.scale<=1);assert.ok(card.width>0&&card.height>0&&card.width<=w+1e-7&&card.height<=h+1e-7);assert.ok(card.left>=card.clip.left-1e-7&&card.top>=card.clip.top-1e-7&&card.left+card.width<=card.clip.left+card.clip.width+1e-7&&card.top+card.height<=card.clip.top+card.clip.height+1e-7);const initial=bySlot.get(card.slot);assert.deepEqual([card.textureWidth,card.textureHeight],[initial.textureWidth,initial.textureHeight]);assert.ok(card.corner>=0&&card.corner<=Math.min(card.rect.width,card.rect.height)/2);if(card.visible){seen.add(card.slot);assert.equal(card.alpha,1);assert.ok(card.depth>=full[0].depth-1e-7);}assert.ok(card.upper.concat(card.lower).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));}
 }
 assert.equal(seen.size,n,'Every source appears during the cycle');
 const a=pose(.317,c,n,w,h),b=pose(.317,c,n,w*2,h*2);for(let i=0;i<n;i++){assert.equal(a[i].slot,b[i].slot);assert.equal(a[i].scale,b[i].scale);for(const key of ['left','top','width','height','textureWidth','textureHeight','corner'])assert.ok(Math.abs(b[i][key]-a[i][key]*2)<1e-6);}
}
for(const n of [2,4,10])for(const hold of [0,30,60])for(let i=0;i<n;i++){
 const front=pose((i+.99)/n,{hold},n).filter(c=>c.visible).at(-1);assert.equal(front.slot,i);if(hold>0){assert.equal(front.scale,1);}if(hold>0)assert.deepEqual(pose((i+.8)/n,{hold},n).map(({age,depth,...c})=>c),pose((i+.95)/n,{hold},n).map(({age,depth,...c})=>c));
}
assert.notDeepEqual(pose(.15,{flow:'staggered',overlap:20}),pose(.15,{flow:'staggered',overlap:100}));
// Volley launches stay ordered inside a group, even when its size is larger than the source count.
for(const n of [2,7,10])for(const groupSize of [2,3,10]){const group=Math.min(n,groupSize),interval=1/Math.ceil(n/group),delay=interval*Math.min(.16,.6/Math.max(1,group-1));for(let i=0;i<n;i++){const p=Math.floor(i/group)*interval+(i%group)*delay+.001;const young=pose(p,{flow:'volley',groupSize},n).filter(c=>c.visible).at(-1);assert.equal(young.slot,i);}}
assert.equal(pose(0,{},1).length,2);assert.equal(pose(0,{},999).length,10);
const scroll={...defaults,flow:'volley',turns:3,start:20,end:80};assert.deepEqual(plain(model.layout(1280,720,scroll,.1,7,1,true)),plain(model.layout(1280,720,scroll,.9,7,1,true)));
const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,10,1,true)),plain(model.layout(390,844,scroll,.317,10,1,true)));
console.log('Poster Burst: defaults/bounds, 2–10 sources, three flows/hold/overlap/ordered volleys, opaque full-frame backdrop, source turns/depth, ratios/responsive scale, dynamic corners/stable textures/bounded canvases, loop/scroll and exported factory OK');
