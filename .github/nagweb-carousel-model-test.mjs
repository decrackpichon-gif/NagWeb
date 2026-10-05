import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../js/nagweb-story-model.js',import.meta.url),'utf8'),context);
const model=context.window.NAGWEB_STREAM_MODEL,plain=v=>JSON.parse(JSON.stringify(v));
const defaults=plain(model.config({kind:'carousel-flow'}));
assert.equal(defaults.kind,'carousel-flow');assert.equal(defaults.direction,'horizontal');assert.equal(defaults.sideScale,.82);assert.equal(defaults.gap,5);assert.equal(defaults.cardRatio,'1:1');
assert.equal(model.config({kind:'carousel-flow',direction:'unknown'}).direction,'horizontal');
assert.equal(model.config({kind:'carousel-flow',sideScale:4,gap:-8}).sideScale,1);assert.equal(model.config({kind:'carousel-flow',sideScale:0,gap:90}).gap,15);
assert.equal(model.config({kind:'carousel-flow',cardRatio:'frame'}).cardRatio,'frame');assert.notEqual(model.config({kind:'ticker-loop',cardRatio:'frame'}).cardRatio,'frame');
const center=t=>({x:(t.polygon[0].x+t.polygon[2].x)/2,y:(t.polygon[0].y+t.polygon[2].y)/2});
for(const [width,height] of [[1280,720],[390,844]])for(const direction of ['horizontal','vertical'])for(const frameRatio of ['auto','16:9','9:16'])for(const count of [3,5,10])for(const cardRatio of ['auto','1:1','16:9','9:16','frame']){
 const config={kind:'carousel-flow',direction,frameRatio,cardRatio},start=plain(model.layout(width,height,config,0,count,1.6,false));
 assert.deepEqual(plain(model.layout(width,height,config,1,count,1.6,false)),start);const textures=new Map(start.map(c=>[c.slot,[c.textureWidth,c.textureHeight,c.corner]])),seen=new Set();
 for(let sample=0;sample<60;sample++){
  const cards=plain(model.layout(width,height,config,sample/60,count,1.6,false));assert.equal(cards.length,count);
  cards.forEach((c,i)=>{
   assert.deepEqual([c.textureWidth,c.textureHeight,c.corner],textures.get(c.slot));assert.ok(c.width<=c.clip.width+1e-8&&c.height<=c.clip.height+1e-8);if(i)assert.ok(cards[i-1].depth<=c.depth);assert.ok(c.alpha>=0&&c.alpha<=1);
   if(c.visible)seen.add(c.slot);assert.equal(c.visible,c.instances.length>0);
   for(const t of c.instances){assert.ok(t.alpha>=.55&&t.alpha<=1);const p=t.polygon;assert.equal(p.length,4);for(const n of p)assert.ok(Number.isFinite(n.x)&&Number.isFinite(n.y));assert.ok(Math.abs(p[0].y-p[1].y)<1e-7&&Math.abs(p[0].x-p[3].x)<1e-7);if(cardRatio!=='frame')assert.ok(Math.abs((p[1].x-p[0].x)/(p[3].y-p[0].y)-(model.ratios[cardRatio]||1.6))<1e-7);}
  });
 }
 assert.equal(seen.size,count);const normal=plain(model.layout(width,height,config,.237,count,1.6,false)),doubled=plain(model.layout(width*2,height*2,config,.237,count,1.6,false));
 for(let i=0;i<count;i++){const a=normal[i],b=doubled[i];for(const k of ['left','top','textureWidth','textureHeight','corner'])assert.ok(Math.abs(b[k]-a[k]*2)<1e-6);if(a.visible)for(const k of ['width','height'])assert.ok(Math.abs(b[k]-a[k]*2)<1e-6);assert.equal(a.instances.length,b.instances.length);a.instances.forEach((t,j)=>t.polygon.forEach((p,k)=>{assert.ok(Math.abs(doubled[i].instances[j].polygon[k].x-p.x*2)<1e-6);assert.ok(Math.abs(doubled[i].instances[j].polygon[k].y-p.y*2)<1e-6);}));}
}
for(const direction of ['horizontal','vertical']){
 const config={kind:'carousel-flow',direction};for(let slot=0;slot<5;slot++){const cards=plain(model.layout(1280,720,config,slot/5,5,1,false)),focused=cards.find(c=>c.slot===slot),tile=focused.instances.find(t=>t.focus>.99999);assert.ok(tile);assert.deepEqual(center(tile),{x:640,y:360});assert.equal(focused.alpha,1);assert.equal(cards.at(-1).slot,slot);}
 assert.deepEqual(plain(model.layout(1280,720,config,.55/5,5,1,false)),plain(model.layout(1280,720,config,.9/5,5,1,false)),'The centered image holds between transitions');
 const side=model.layout(1280,720,{...config,sideScale:.6},.225/5,5,1,false).find(c=>c.slot===1).instances[0],full=model.layout(1280,720,{...config,sideScale:1},.225/5,5,1,false).find(c=>c.slot===1).instances[0];assert.ok((side.polygon[1].x-side.polygon[0].x)<(full.polygon[1].x-full.polygon[0].x));
}
// A short vertical sequence repeats its edge tiles rather than teleporting a visible source.
const wrapConfig={kind:'carousel-flow',direction:'vertical',frameRatio:'9:16',cardRatio:'16:9'},epsilon=1e-7;
const before=plain(model.layout(390,844,wrapConfig,.225/3-epsilon,3,1,false)),after=plain(model.layout(390,844,wrapConfig,.225/3+epsilon,3,1,false));
assert.ok(before.some(c=>c.instances.length>1));for(const a of before){const b=after.find(c=>c.slot===a.slot);assert.equal(a.instances.length,b.instances.length);for(const t of a.instances){const p=center(t);assert.ok(b.instances.some(u=>Math.hypot(center(u).x-p.x,center(u).y-p.y)<.005));}}
const scroll={kind:'carousel-flow',turns:3,start:20,end:80};assert.equal(model.phase(.1,model.config(scroll),true),0);assert.equal(model.phase(.5,model.config(scroll),true),1.5);assert.equal(model.phase(.9,model.config(scroll),true),3);
assert.deepEqual(plain(model.layout(1280,720,scroll,.1,5,1,true)),plain(model.layout(1280,720,scroll,.9,5,1,true)));
const exported=vm.runInContext('('+context.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()',context);assert.deepEqual(plain(exported.layout(390,844,wrapConfig,.317,3,1,true)),plain(model.layout(390,844,wrapConfig,.317,3,1,true)));
console.log('Carousel Flow: 3–10 imágenes, foco central y pausa, horizontal/vertical, proporciones e imágenes rectangulares, repeticiones sin saltos, texturas estables, cierre exacto, escala proporcional, Scroll y fábrica exportada OK');
