import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),config=model.config({kind:'iso-focus-sequence',backgroundType:'none'});
assert.equal(config.size,42);assert.equal(config.skew,20);assert.equal(config.spacing,20);assert.equal(config.focusGap,85);assert.equal(config.centerScale,100);assert.equal(config.direction,'down');assert.equal(config.cardRatio,'1:1');
const center=t=>({x:(t.polygon[0].x+t.polygon[2].x)/2,y:(t.polygon[0].y+t.polygon[2].y)/2});
for(const [width,height] of [[1280,720],[390,844]])for(const count of [4,10,16])for(const direction of ['down','up'])for(const frameRatio of ['auto','16:9','9:16'])for(const cardRatio of ['auto','1:1','16:9','9:16'])for(const skew of [0,20,90]){
 const c={...config,direction,frameRatio,cardRatio,skew,centerScale:160},layout=p=>plain(model.layout(width,height,c,p,count,1.6,false)),start=layout(0),textures=new Map(start.map(n=>[n.slot,[n.textureWidth,n.textureHeight,n.corner]])),seen=new Set();
 assert.equal(start.length,count);assert.deepEqual(start,layout(1),'A full cycle closes exactly');
 for(let sample=0;sample<24;sample++){const cards=layout(sample/24);for(const [i,n] of cards.entries()){
  assert.deepEqual([n.textureWidth,n.textureHeight,n.corner],textures.get(n.slot),'Focus zoom retains its source texture');assert.equal(n.visible,n.instances.length>0);assert.ok(Number.isFinite(n.depth));assert.ok(n.width<=n.clip.width+1e-7&&n.height<=n.clip.height+1e-7);if(i)assert.ok(cards[i-1].depth<=n.depth);
  if(n.visible)seen.add(n.slot);
  for(const t of n.instances){const [a,b,d,e]=t.polygon;assert.equal(t.alpha,1);assert.equal(t.upper.length,2);assert.equal(t.lower.length,2);assert.ok(Number.isFinite(t.depth));assert.equal(e.x,a.x);assert.equal(d.x,b.x);assert.ok(Math.abs((b.y-a.y)/(b.x-a.x)-skew/100)<1e-7);assert.ok(Math.abs((b.x-a.x)/(e.y-a.y)-(model.ratios[cardRatio]||1.6))<1e-7,'Source proportions remain stable under the affine tilt');assert.ok(Math.abs(d.y-(b.y+e.y-a.y))<1e-7);for(const p of t.polygon)assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));}
 }}
 assert.equal(seen.size,count,'Every source crosses the frame');
 const a=layout(.237),b=plain(model.layout(width*2,height*2,c,.237,count,1.6,false));for(let i=0;i<count;i++){assert.equal(a[i].instances.length,b[i].instances.length);for(const key of ['left','top','textureWidth','textureHeight','corner'])assert.ok(Math.abs(a[i][key]*2-b[i][key])<1e-6);if(a[i].visible)for(const key of ['width','height'])assert.ok(Math.abs(a[i][key]*2-b[i][key])<1e-6);a[i].instances.forEach((t,j)=>t.polygon.forEach((p,k)=>{for(const key of ['x','y'])assert.ok(Math.abs(p[key]*2-b[i].instances[j].polygon[k][key])<1e-6);}));}
}
for(let slot=0;slot<10;slot++){
 const n=model.layout(1280,720,config,slot/10,10,1,false).find(n=>n.slot===slot),t=n.instances.find(t=>t.focus>.99999);assert.ok(t);assert.deepEqual(center(t),{x:640,y:360});
}
const pose=(c,p)=>plain(model.layout(1280,720,c,p,10,1,false));
assert.deepEqual(pose(config,.05/10),pose(config,.1/10),'The spotlight pauses before stepping');assert.deepEqual(pose(config,.9/10),pose(config,.99/10),'The next image holds after landing');
const large=pose({...config,centerScale:160},0).find(n=>n.slot===0).instances.find(t=>t.focus===1),normal=pose(config,0).find(n=>n.slot===0).instances.find(t=>t.focus===1);assert.ok(Math.abs((large.polygon[1].x-large.polygon[0].x)/(normal.polygon[1].x-normal.polygon[0].x)-1.6)<1e-7);
const down=pose(config,.04),up=pose({...config,direction:'up'},.04);for(const a of down){const b=up.find(n=>n.slot===a.slot);for(const tile of a.instances){const p=center(tile);assert.ok(b.instances.some(t=>{const q=center(t);return Math.abs(p.x+q.x-1280)<1e-6&&Math.abs(p.y+q.y-720)<1e-6;}));}}
assert.notDeepEqual(pose({...config,focusGap:30},.04),pose(config,.04));assert.notDeepEqual(pose({...config,spacing:60},.04),pose(config,.04));
// Copies retain source identity and position across a spotlight step and the cycle seam.
for(const seam of [1/4,1]){
 const cfg={...config,size:25,spacing:10,focusGap:30,frameRatio:'auto'},a=model.layout(1280,720,cfg,seam-1e-8,4,1,false),b=model.layout(1280,720,cfg,seam+1e-8,4,1,false);assert.ok(a.some(n=>n.instances.length>1));
 for(const card of a)for(const t of card.instances){const p=center(t);if(p.x<30||p.x>1250||p.y<30||p.y>690)continue;assert.ok(b.find(n=>n.slot===card.slot).instances.some(u=>Math.hypot(center(u).x-p.x,center(u).y-p.y)<.01),'Visible sources continue through the seam');}
}
const sequence={...config,turns:3,start:20,end:80};assert.equal(model.phase(.1,sequence,true),0);assert.equal(model.phase(.5,sequence,true),1.5);assert.equal(model.phase(.9,sequence,true),3);assert.deepEqual(plain(model.layout(1280,720,sequence,.1,10,1,true)),plain(model.layout(1280,720,sequence,.9,10,1,true)));
assert.equal(model.config({kind:'iso-focus-sequence',size:1000,skew:-20,focusGap:1000,centerScale:0}).size,70);assert.equal(model.config({kind:'iso-focus-sequence',skew:-20}).skew,0);assert.equal(model.config({kind:'iso-focus-sequence',centerScale:0}).centerScale,80);assert.equal(model.config({kind:'iso-focus-sequence',direction:'invalid'}).direction,'down');assert.equal(model.layout(1280,720,config,0,100).length,16);
const serialized=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(serialized.layout(390,844,{...sequence,direction:'up',centerScale:160},.32,16,1,true)),plain(model.layout(390,844,{...sequence,direction:'up',centerScale:160},.32,16,1,true)));
console.log('Iso Focus: 4–16 imágenes, foco diagonal escalonado y pausa, inclinación afín y proporciones, sentidos, copias sin saltos, profundidad, texturas estables, cierre exacto, escala proporcional, Scroll y fábrica exportada OK');
