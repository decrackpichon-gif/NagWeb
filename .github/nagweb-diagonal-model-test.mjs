import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{}};
vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),context);
const model=context.window.NAGWEB_STREAM_MODEL,plain=v=>JSON.parse(JSON.stringify(v));
const directions={'diagonal-carousel':['downRight','downLeft','upRight','upLeft'],'iso-cascade':['up','down','down-right','up-left']};
for(const kind of Object.keys(directions)){
 const cascade=kind==='iso-cascade',movementKey=cascade?'motion':'movement',minimum=cascade?4:3,maximum=cascade?20:12;
 const defaults=model.config({kind});assert.equal(defaults.cardRatio,'1:1');assert.equal(defaults[movementKey],'continuous');assert.equal(defaults.direction,directions[kind][0]);
 for(const [width,height] of [[1280,720],[390,844]])for(const count of [minimum,maximum])for(const direction of directions[kind])for(const movement of ['continuous','stepped'])for(const cardRatio of ['auto','1:1','9:16','16:9']){
  const c={kind,direction,[movementKey]:movement,cardRatio,frameRatio:'auto'},pose=p=>plain(model.layout(width,height,c,p,count,1.6,false)),start=pose(0),seen=new Set();
  assert.equal(start.length,count);assert.deepEqual(start,pose(1),'A whole cycle closes exactly');
  const textures=new Map(start.map(n=>[n.slot,[n.textureWidth,n.textureHeight,n.corner]]));
  for(let sample=0;sample<24;sample++)for(const n of pose(sample/24)){
   assert.deepEqual([n.textureWidth,n.textureHeight,n.corner],textures.get(n.slot),'Motion retains one stable texture per source');
   assert.ok(n.width<=n.clip.width+1e-7&&n.height<=n.clip.height+1e-7,'Copies are bounded by the frame');
   for(const t of n.instances){seen.add(n.slot);assert.ok(Number.isFinite(t.depth));assert.equal(t.polygon.length,4);for(const p of t.polygon)assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));const [a,b,c,d]=t.polygon;assert.ok(Math.abs(c.x-b.x-d.x+a.x)<1e-7&&Math.abs(c.y-b.y-d.y+a.y)<1e-7,'Surfaces remain parallelograms');}
  }
  assert.equal(seen.size,count,'Every image travels through the frame');
  const a=pose(.237),b=plain(model.layout(width*2,height*2,c,.237,count,1.6,false));
  for(let i=0;i<count;i++){assert.equal(a[i].slot,b[i].slot);assert.equal(a[i].instances.length,b[i].instances.length);a[i].instances.forEach((t,j)=>t.polygon.forEach((p,k)=>{for(const key of ['x','y'])assert.ok(Math.abs(b[i].instances[j].polygon[k][key]-p[key]*2)<1e-6);}));}
 }
 const center=t=>t.polygon.reduce((a,p)=>({x:a.x+p.x/4,y:a.y+p.y/4}),{x:0,y:0});
 for(const direction of directions[kind]){
  const c={kind,direction,frameRatio:'auto',[movementKey]:'continuous'},p0=plain(model.layout(1280,720,c,0,maximum,1,false)).find(n=>n.slot===0).instances.find(t=>t.position===0),p1=plain(model.layout(1280,720,c,.1/maximum,maximum,1,false)).find(n=>n.slot===0).instances.find(t=>Math.abs(t.position+.1)<1e-6),a=center(p0),b=center(p1);
  assert.equal(Math.sign(b.x-a.x),['downLeft','upLeft','down','up-left'].includes(direction)?-1:1,'Direction matches its horizontal label');
  assert.equal(Math.sign(b.y-a.y),['upRight','upLeft','up','up-left'].includes(direction)?-1:1,'Direction matches its vertical label');
 }
 const stepped={kind,frameRatio:'auto',[movementKey]:'stepped'},pose=p=>plain(model.layout(1280,720,stepped,p,maximum,1,false));
 if(cascade)assert.deepEqual(pose(.01/maximum),pose(.1/maximum),'Stepped cascade holds before moving');
 else{assert.notDeepEqual(plain(model.layout(1280,720,{...stepped,stagger:0},.2/maximum,maximum,1,false)),plain(model.layout(1280,720,{...stepped,stagger:100},.2/maximum,maximum,1,false)));}
 const scroll={...stepped,turns:3,start:20,end:80};assert.deepEqual(plain(model.layout(1280,720,scroll,.1,maximum,1,true)),plain(model.layout(1280,720,scroll,.9,maximum,1,true)));
 const exported=vm.runInNewContext('('+context.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,maximum,1.6,true)),plain(model.layout(390,844,scroll,.317,maximum,1.6,true)));
 assert.equal(model.layout(1280,720,defaults,0,100).length,maximum);assert.equal(model.layout(1280,720,defaults,0,1).length,minimum);
}
assert.equal(model.config({kind:'diagonal-carousel',overlap:999,stagger:-5,direction:'invalid'}).overlap,85);
assert.equal(model.config({kind:'iso-cascade',skew:999,spacing:-5,direction:'invalid'}).skew,90);
console.log('Diagonal Carousel / Iso Cascade: directions, modes, linked copies, bounded geometry, stable textures, full cycles, responsive scale, scroll and exported factory OK');
