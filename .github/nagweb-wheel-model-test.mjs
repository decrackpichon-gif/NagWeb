import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),defaults=model.config({kind:'wheel-carousel'}),pose=(p,c={},n=6,w=1280,h=720)=>plain(model.layout(w,h,{...defaults,...c},p,n));
assert.equal(defaults.cardSize,70);assert.equal(defaults.wheelSize,105);assert.equal(defaults.anticipation,20);assert.equal(defaults.overshoot,10);assert.equal(defaults.hold,33);assert.equal(defaults.cornerRadius,5);assert.equal(defaults.cardRatio,'1:1');assert.equal(defaults.direction,'right');
for(const [key,s] of Object.entries(model.wheelSpecs)){assert.equal(model.config({kind:'wheel-carousel',[key]:999})[key],s[2]);assert.equal(model.config({kind:'wheel-carousel',[key]:-999})[key],s[1]);}
for(const n of [4,6,10])for(const direction of ['right','left'])for(const cardRatio of ['auto','1:1','9:16','16:9'])for(const [w,h] of [[1280,720],[390,844]]){
 const cfg={direction,cardRatio,frameRatio:'auto'},start=pose(0,cfg,n,w,h);assert.deepEqual(start,pose(1,cfg,n,w,h));const seen=new Set();
 for(let sample=0;sample<32;sample++)for(const card of pose(sample/32,cfg,n,w,h)){
  assert.ok(card.width>0&&card.height>0&&card.width<=w+1e-7&&card.height<=h+1e-7);assert.ok(card.left>=card.clip.left-1e-7&&card.top>=card.clip.top-1e-7&&card.left+card.width<=card.clip.left+card.clip.width+1e-7&&card.top+card.height<=card.clip.top+card.clip.height+1e-7);assert.deepEqual([card.textureWidth,card.textureHeight,card.corner],[start[card.slot].textureWidth,start[card.slot].textureHeight,start[card.slot].corner]);
  for(const t of card.instances){assert.ok(t.alpha>0&&t.alpha<=1);assert.equal(t.upper.length,2);assert.equal(t.stripDepth[0],t.depth);assert.ok(t.polygon.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));assert.equal(t.rounded.radius,card.corner);assert.ok(Math.cos(t.angle)>=-.05);if(Math.abs(t.angle)<.03)seen.add(card.slot);}
 }
 for(let i=0;i<n;i++){const initial=pose(i/n,cfg,n,w,h)[i];assert.ok(initial.instances.some(t=>Math.abs(t.angle)<1e-7));seen.add(i);const hold=pose((i+.85)/n,cfg,n,w,h);assert.deepEqual(hold,pose((i+.95)/n,cfg,n,w,h));assert.ok(hold[(i+1)%n].instances.some(t=>Math.abs(t.angle)<1e-7));}
 assert.equal(seen.size,n);
 const a=pose(.317,cfg,n,w,h),b=pose(.317,cfg,n,w*2,h*2);for(let i=0;i<n;i++){assert.equal(a[i].instances.length,b[i].instances.length);for(let k=0;k<a[i].instances.length;k++)for(let j=0;j<4;j++){const p=a[i].instances[k].polygon[j],q=b[i].instances[k].polygon[j];assert.ok(Math.abs(q.x-p.x*2)<1e-6&&Math.abs(q.y-p.y*2)<1e-6);}}
 // Last and first poses meet through the source-linked copy on the opposite half of the wheel.
 const end=pose(1-1e-8,cfg,n,w,h);for(let i=0;i<n;i++){const a=start[i].instances.slice().sort((a,b)=>a.angle-b.angle),b=end[i].instances.slice().sort((a,b)=>a.angle-b.angle);assert.equal(a.length,b.length);for(let j=0;j<a.length;j++)for(let k=0;k<4;k++){assert.ok(Math.abs(a[j].polygon[k].x-b[j].polygon[k].x)<1e-5&&Math.abs(a[j].polygon[k].y-b[j].polygon[k].y)<1e-5);}}
}
const top=(p,c={})=>pose(p,c).flatMap(card=>card.instances.map(t=>({...t,slot:card.slot}))).sort((a,b)=>b.depth-a.depth)[0];
assert.ok(top(.1/6).angle<0,'Anticipation initially reverses the wheel');assert.ok(top(.402/6).angle>0&&top(.402/6).slot===1,'Next card passes its resting position');assert.ok(Math.abs(top(.9/6).angle)<1e-7);assert.equal(top(.9/6).slot,1);
assert.equal(top(.1/6,{anticipation:0}).angle,0);assert.ok(Math.abs(top(.402/6,{overshoot:0}).angle)<1e-7);
const copies=pose(0,{wheelSize:70,cardSize:90,cardRatio:'16:9'},4);assert.ok(copies.some(card=>card.instances.length===2),'Both visible linked copies share one source');assert.ok(copies.flatMap(c=>c.instances).some(t=>t.alpha<1),'Wheel edge cards fade at the rear cutoff');
for(const n of [4,10])for(const wheelSize of [70,160])for(const cardSize of [40,90])for(const anticipation of [0,40])for(const overshoot of [0,30])for(const hold of [0,60])for(const offsetX of [-50,50]){const cards=pose(.317,{wheelSize,cardSize,anticipation,overshoot,hold,offsetX,offsetY:50},n);assert.ok(cards.every(c=>c.width<=c.clip.width+1e-7&&c.height<=c.clip.height+1e-7));}
assert.equal(pose(0,{},1).length,4);assert.equal(pose(0,{},999).length,10);const scroll={...defaults,turns:3,start:20,end:80};assert.deepEqual(plain(model.layout(1280,720,scroll,.1,6,1,true)),plain(model.layout(1280,720,scroll,.9,6,1,true)));
const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,10,1,true)),plain(model.layout(390,844,scroll,.317,10,1,true)));
console.log('Wheel Carousel: defaults/bounds, 4–10 sources, anticipation/overshoot/holds, both directions, rotated linked copies and depth, rear-edge fades, seamless source loop, ratios/offsets/responsive scale, stable textures/bounded canvases, scroll and exported factory OK');
