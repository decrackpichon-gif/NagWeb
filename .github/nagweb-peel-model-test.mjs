import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),defaults=model.config({kind:'deck-peel'});
const pose=(p,c={},n=4,w=1280,h=720)=>plain(model.layout(w,h,{...defaults,...c},p,n));
assert.equal(defaults.cardSize,48);assert.equal(defaults.peek,4);assert.equal(defaults.cardRatio,'1:1');
for(const [key,s] of Object.entries(model.peelSpecs)){assert.equal(model.config({kind:'deck-peel',[key]:999})[key],s[2]);assert.equal(model.config({kind:'deck-peel',[key]:-999})[key],s[1]);}
for(const n of [4,5,8])for(const cardSize of [35,48,65])for(const peek of [2,4,8])for(const cardRatio of ['auto','1:1','9:16','16:9'])for(const [w,h] of [[1280,720],[390,844]]){
 const cfg={cardSize,peek,cardRatio,frameRatio:'auto'},start=pose(0,cfg,n,w,h);assert.deepEqual(start,pose(1,cfg,n,w,h));
 for(let i=0;i<n;i++){
  const front=pose(i/n,cfg,n,w,h)[i];assert.ok(front.instances.some(t=>t.level===0&&t.fall===0&&t.depth===5));
  const hold=pose((i+.75)/n,cfg,n,w,h);assert.deepEqual(hold,pose((i+.9)/n,cfg,n,w,h));assert.ok(hold[(i+1)%n].instances.some(t=>t.level===0));
  // Last hold and next turn have identical visible source geometry.
  const surfaces=cards=>cards.map(c=>c.instances.map(t=>({polygon:t.polygon,alpha:t.alpha})).sort((a,b)=>a.polygon[0].y-b.polygon[0].y));
  assert.deepEqual(surfaces(hold),surfaces(pose(((i+1)%n)/n,cfg,n,w,h)));
 }
 for(let sample=0;sample<16;sample++)for(const card of pose(sample/16,cfg,n,w,h)){
  assert.ok(card.width>0&&card.height>0&&card.width<=w+1e-7&&card.height<=h+1e-7);assert.deepEqual([card.textureWidth,card.textureHeight,card.corner],[start[card.slot].textureWidth,start[card.slot].textureHeight,start[card.slot].corner]);
  for(const t of card.instances){assert.ok(t.alpha>0&&t.alpha<=1);assert.equal(t.stripDepth.length,1);assert.equal(t.stripDepth[0],t.depth);assert.ok(t.polygon.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)));assert.ok(t.level>=0&&t.level<=4);}
 }
 const a=pose(.213,cfg,n,w,h),b=pose(.213,cfg,n,w*2,h*2);for(let i=0;i<n;i++){assert.equal(a[i].instances.length,b[i].instances.length);for(let k=0;k<a[i].instances.length;k++)for(let j=0;j<4;j++){const p=a[i].instances[k].polygon[j],q=b[i].instances[k].polygon[j];assert.ok(Math.abs(q.x-p.x*2)<1e-6&&Math.abs(q.y-p.y*2)<1e-6);}}
}
// The outgoing card stays in front; the four-image deck links its recycled copy to its source.
const moving=pose(.2/4);assert.ok(moving[0].instances.length===2);assert.ok(moving[0].instances.find(t=>t.fall>0).depth>Math.max(...moving.slice(1).flatMap(c=>c.instances.map(t=>t.depth))));
assert.notDeepEqual(pose(.1/4),pose(.4/4));assert.equal(pose(0,{},1).length,4);assert.equal(pose(0,{},999).length,8);
const scroll={...defaults,turns:3,start:20,end:80};assert.deepEqual(plain(model.layout(1280,720,scroll,.1,8,1,true)),plain(model.layout(1280,720,scroll,.9,8,1,true)));
const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,8,1,true)),plain(model.layout(390,844,scroll,.317,8,1,true)));
console.log('Deck Peel: defaults/bounds, 4–8 source turns, fall/hold, continuous source handoffs, outgoing depth/recycled copies, ratios/portrait/scale, stable textures/bounded geometry, scroll and exported factory OK');
