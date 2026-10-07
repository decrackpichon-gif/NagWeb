import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x));
for(const kind of ['film-strip','card-totem']){
 const defaults=model.config({kind}),vertical=kind==='card-totem',specs=vertical?model.totemSpecs:model.filmSpecs,pose=(p,c={},n=6,w=1280,h=720)=>plain(model.layout(w,h,{...defaults,...c},p,n));
 assert.equal(defaults.cardSize,vertical?34:32);assert.equal(defaults.curve,70);assert.equal(defaults.gap,2.5);assert.equal(defaults.cardRatio,'1:1');assert.equal(defaults.motion,'flow');for(const [k,s] of Object.entries(specs)){assert.equal(model.config({kind,[k]:999})[k],s[2]);assert.equal(model.config({kind,[k]:-999})[k],s[1]);}
 for(const n of [3,6,12])for(const curve of [-100,0,70,100])for(const cardRatio of ['1:1','9:16','16:9'])for(const [w,h] of [[1280,720],[390,844]]){
  const cfg={curve,cardRatio,frameRatio:'auto'},start=pose(0,cfg,n,w,h),seen=new Set();assert.deepEqual(start,pose(1,cfg,n,w,h));
  for(let sample=0;sample<24;sample++)for(const card of pose(sample/24,cfg,n,w,h)){
   assert.ok(card.width>0&&card.width<=w+1e-7&&card.height>0&&card.height<=h+1e-7);assert.ok(card.left>=card.clip.left-1e-7&&card.top>=card.clip.top-1e-7&&card.left+card.width<=card.clip.left+card.clip.width+1e-7&&card.top+card.height<=card.clip.top+card.clip.height+1e-7);assert.deepEqual([card.textureWidth,card.textureHeight,card.corner],[start[card.slot].textureWidth,start[card.slot].textureHeight,start[card.slot].corner]);if(card.visible)seen.add(card.slot);
   for(const t of card.instances){assert.equal(t.vertical,vertical);assert.equal(t.upper.length,curve===0?2:49);assert.equal(t.lower.length,t.upper.length);assert.equal(t.stripDepth.length,t.upper.length-1);assert.ok(t.alpha>=.25&&t.alpha<=1);assert.ok(t.polygon.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));}
  }
  assert.equal(seen.size,n);const a=pose(.317,cfg,n,w,h),b=pose(.317,cfg,n,w*2,h*2);for(let i=0;i<n;i++){assert.equal(a[i].instances.length,b[i].instances.length);for(let k=0;k<a[i].instances.length;k++)for(let j=0;j<a[i].instances[k].polygon.length;j++){const p=a[i].instances[k].polygon[j],q=b[i].instances[k].polygon[j];assert.ok(Math.abs(q.x-p.x*2)<1e-6&&Math.abs(q.y-p.y*2)<1e-6);}}
 }
 // Every stop holds the next source at center, with the same stepped motion on either axis.
 for(let i=0;i<6;i++){const cards=pose((i+.75)/6,{motion:'steps'});assert.ok(cards[(i+1)%6].instances.some(t=>Math.abs(t.center)<1e-7));assert.deepEqual(cards,pose((i+.9)/6,{motion:'steps'}));}assert.notDeepEqual(pose(.1/6,{motion:'steps'}),pose(.4/6,{motion:'steps'}));assert.notDeepEqual(pose(.2,{curve:-100}),pose(.2,{curve:100}));
 const centered=curve=>pose(0,{curve}).find(c=>c.slot===0).instances.find(t=>t.center===0),flat=centered(0),out=centered(100),inward=centered(-100),extent=t=>vertical?t.lower[0].x-t.upper[0].x:t.lower[0].y-t.upper[0].y;assert.ok(extent(out)<extent(flat)&&extent(inward)>extent(flat),'Curve sign changes the size of the receding edges');
 // Short sequences fill wide/tall frames with linked repetitions; no fixed three-copy limit.
 const repeated=pose(.13,{curve:0,cardSize:22,cardRatio:vertical?'16:9':'9:16',frameRatio:'auto'},3,vertical?390:2560,vertical?1600:720);assert.ok(repeated.flatMap(c=>c.instances).length>9);assert.ok(repeated.every(c=>c.instances.length>1));
 assert.equal(pose(0,{},1).length,3);assert.equal(pose(0,{},999).length,12);const scroll={...defaults,turns:3,start:20,end:80};assert.deepEqual(plain(model.layout(1280,720,scroll,.1,6,1,true)),plain(model.layout(1280,720,scroll,.9,6,1,true)));const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,12,1,true)),plain(model.layout(390,844,scroll,.317,12,1,true)));
}
console.log('Film Strip / Card Totem: defaults/bounds, 3–12 images, inward/outward/flat curvature, continuous/center stops, source-linked repeated cards filling long frames, stable textures/bounded geometry, per-strip depth, ratios, loop, responsive scale, scroll and exported factory OK');
