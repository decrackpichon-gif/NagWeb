import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../js/nagweb-story-model.js',import.meta.url),'utf8'),context);
const model=context.window.NAGWEB_STREAM_MODEL,plain=v=>JSON.parse(JSON.stringify(v)),base={kind:'stack-slide'};
const config=plain(model.config(base));assert.equal(config.inset,4);assert.equal(config.depthScale,.95);assert.equal(config.offsetX,0);assert.equal(config.offsetY,0);assert.equal(config.cardRatio,'1:1');
assert.equal(model.config({...base,cardRatio:'frame'}).cardRatio,'frame');assert.equal(model.config({...base,inset:999,depthScale:0,offsetX:-90,offsetY:90}).inset,15);assert.equal(model.config({...base,depthScale:0}).depthScale,.85);assert.equal(model.config({...base,offsetX:-90}).offsetX,-50);assert.equal(model.config({...base,offsetY:90}).offsetY,50);
const center=c=>({x:(c.upper[0].x+c.lower[1].x)/2,y:(c.upper[0].y+c.lower[1].y)/2}),span=c=>Math.hypot(c.upper[1].x-c.upper[0].x,c.upper[1].y-c.upper[0].y);
for(const [width,height] of [[1280,720],[390,844]])for(const frameRatio of ['auto','16:9','9:16'])for(const cardRatio of ['auto','1:1','16:9','9:16','frame'])for(const count of [3,4,8])for(const depthScale of [.85,.95,1]){
 const raw={...base,frameRatio,cardRatio,depthScale},start=plain(model.layout(width,height,raw,0,count,1.4,false));assert.equal(start.length,count);assert.deepEqual(plain(model.layout(width,height,raw,1,count,1.4,false)),start);const textures=new Map(start.map(c=>[c.slot,[c.textureWidth,c.textureHeight,c.corner]])),seen=new Set();
 for(let sample=0;sample<40;sample++){
  const cards=plain(model.layout(width,height,raw,sample/40,count,1.4,false));assert.equal(cards.length,count);assert.ok(cards.filter(c=>c.alpha>0).length<=3);
  cards.forEach((c,i)=>{assert.deepEqual([c.textureWidth,c.textureHeight,c.corner],textures.get(c.slot));assert.ok(c.width<=c.clip.width+1e-8&&c.height<=c.clip.height+1e-8);assert.ok(c.alpha>=0&&c.alpha<=1);if(i)assert.ok(cards[i-1].depth<=c.depth);if(c.visible)seen.add(c.slot);
   if(c.upper.length){const a=c.upper[0],b=c.upper[1],d=c.lower[0],ux=b.x-a.x,uy=b.y-a.y,vx=d.x-a.x,vy=d.y-a.y;for(const p of c.upper.concat(c.lower))assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(Math.abs(ux*vx+uy*vy)<1e-6,'Cards remain affine rectangles');assert.ok(Math.abs(Math.hypot(ux,uy)/Math.hypot(vx,vy)-c.textureWidth/c.textureHeight)<1e-7);}
  });
 }
 assert.equal(seen.size,count);const first=plain(model.layout(width,height,raw,.231,count,1.4,false)),twice=plain(model.layout(width*2,height*2,raw,.231,count,1.4,false));for(let i=0;i<count;i++){const a=first[i],b=twice[i];for(const k of ['left','top','textureWidth','textureHeight','corner'])assert.ok(Math.abs(b[k]-a[k]*2)<1e-6);if(a.visible)for(const k of ['width','height'])assert.ok(Math.abs(b[k]-a[k]*2)<1e-6);for(let j=0;j<a.upper.length;j++)for(const k of ['x','y']){assert.ok(Math.abs(b.upper[j][k]-a.upper[j][k]*2)<1e-6);assert.ok(Math.abs(b.lower[j][k]-a.lower[j][k]*2)<1e-6);}}
}
for(let slot=0;slot<4;slot++){
 const cards=plain(model.layout(1280,720,base,(slot+.7)/4,4,1,false)),front=cards.at(-1),near=cards.find(c=>c.depth===1),back=cards.find(c=>c.depth===0);assert.equal(front.slot,slot);assert.equal(front.alpha,1);assert.deepEqual(center(front),{x:640,y:360});assert.ok(span(front)>span(near)&&span(near)>span(back));assert.ok(near.alpha>back.alpha);assert.deepEqual(cards,plain(model.layout(1280,720,base,(slot+.95)/4,4,1,false)),'The landed stack holds before the next card');
}
const early=model.layout(1280,720,base,.2/4,4,1,false).find(c=>c.slot===0),late=model.layout(1280,720,base,.5/4,4,1,false).find(c=>c.slot===0);assert.ok(center(early).y>center(late).y);assert.ok(Math.abs(early.upper[1].y-early.upper[0].y)>Math.abs(late.upper[1].y-late.upper[0].y));
const normal=model.layout(1280,720,base,.7/4,4,1,false).at(-1),moved=model.layout(1280,720,{...base,offsetX:10,offsetY:-5},.7/4,4,1,false).at(-1);assert.ok(Math.abs(center(moved).x-center(normal).x-72)<1e-8);assert.ok(Math.abs(center(moved).y-center(normal).y+36)<1e-8);assert.ok(span(model.layout(1280,720,{...base,inset:15},.7/4,4,1,false).at(-1))<span(normal));
const scroll={...base,turns:3,start:20,end:80};assert.equal(model.phase(.1,model.config(scroll),true),0);assert.equal(model.phase(.5,model.config(scroll),true),1.5);assert.equal(model.phase(.9,model.config(scroll),true),3);assert.deepEqual(plain(model.layout(1280,720,scroll,.1,4,1,true)),plain(model.layout(1280,720,scroll,.9,4,1,true)));
const exported=vm.runInContext('('+context.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()',context);assert.deepEqual(plain(exported.layout(390,844,{...base,cardRatio:'frame'},.42,8,1.4,true)),plain(model.layout(390,844,{...base,cardRatio:'frame'},.42,8,1.4,true)));
console.log('Stack Slide: 3–8 imágenes, subida y leve giro, niveles y orden de profundidad, permanencia, proporciones sin deformar, geometría acotada, texturas estables, cierre exacto, escala proporcional, Scroll y fábrica exportada OK');
