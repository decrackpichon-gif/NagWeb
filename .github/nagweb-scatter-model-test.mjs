import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {scatterReference} from './fixtures/animos-scatter-reference.mjs';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const m=scope.window.NAGWEB_STREAM_MODEL,cfg=m.config({kind:'scatter-dial'}),plain=x=>JSON.parse(JSON.stringify(x)),pose=(p,c={},n=8,w=1280,h=720)=>m.layout(w,h,{...cfg,...c},p,n,1.6),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,a+' != '+b);
assert.equal(cfg.kind,'scatter-dial');assert.equal(cfg.cardRatio,'16:9');assert.equal(cfg.padding,6);assert.equal(cfg.cornerRadius,3);assert.equal(cfg.easing,'custom');assert.equal(cfg.easeBezier,'0.84,0,0.16,1');assert.equal(cfg.motion,'continuous');
for(const [key,s] of Object.entries(m.scatterSpecs)){assert.equal(cfg[key],s[0]);assert.equal(m.config({kind:cfg.kind,[key]:-999})[key],s[1]);assert.equal(m.config({kind:cfg.kind,[key]:999})[key],s[2]);assert.equal(m.config({kind:cfg.kind,[key]:NaN})[key],s[0]);}
assert.equal(m.config({...cfg,easing:'__proto__'}).easing,'custom');assert.equal(m.config({...cfg,cardRatio:'frame'}).cardRatio,'16:9');
assert.equal(cfg.direction,'cw');assert.equal(cfg.ringTravel,100);
for(const direction of ['cw','ccw','bad',null])assert.equal(m.config({...cfg,direction}).direction,direction==='ccw'?'ccw':'cw');
for(const [n,expected] of [[0,8],[1,5],[5,5],[12,12],[99,12]])assert.equal(pose(0,{},n).length,expected);
let comparisons=0;
function compare(c,n,w,h,p){
 const cards=pose(p,c,n,w,h),ref=scatterReference({width:w,height:h,t:(p%1+1)%1,params:{...c,cardAspect:c.cardRatio},images:Array(n),imageRatio:1.6}).filter(t=>t.x+t.w>0&&t.x<w&&t.y+t.h>0&&t.y<h),actual=cards.flatMap(card=>card.instances.map(t=>({slot:card.slot,t}))).sort((a,b)=>a.t.depth-b.t.depth);
 assert.equal(actual.length,ref.length,JSON.stringify({c,n,w,h,p}));for(let j=0;j<ref.length;j++){const r=ref[j],{slot,t}=actual[j];assert.equal(slot,r.slot);near(t.center.x,r.x+r.w/2);near(t.center.y,r.y+r.h/2);near(t.mesh.width*t.cardScale,r.w);near(t.mesh.height*t.cardScale,r.h);near(t.planeClipRadius*t.cardScale,r.radius);assert.equal(t.alpha,1);assert.equal(t.shade,1);for(const v of t.mesh.vertices){const uv=m.projectPlane(t.homography.inverse,v.x,v.y);near(uv.x,v.u*t.mesh.width);near(uv.y,v.v*t.mesh.height);}assert.ok(m.meshUV(t.mesh,t.center.x,t.center.y));comparisons++;}
 assert.deepEqual(plain(cards.map(c=>[c.textureWidth,c.textureHeight])),plain(pose(.72,c,n,w,h).map(c=>[c.textureWidth,c.textureHeight])));
}
for(const easing of Object.keys(m.sweepEasings))for(const n of [5,8,12])for(const cardRatio of ['auto','16:9','3:4'])for(const [w,h] of [[1280,720],[390,844]]){
 const c=m.config({...cfg,easing,cardRatio,frameRatio:'auto'});for(const p of [0,.09,.28,.51,.79,.95,.9999,...[30,60,89.999,90,98,106,135,180,205,230,280,330,380,414,415,441.999,442,472,502].map(t=>t/532)])compare(c,n,w,h,p);
}
for(const variant of [{scatterSize:15,cardSize:80,ringSize:60,padding:20,cornerRadius:12},{scatterSize:50,cardSize:15,ringSize:15,padding:0,cornerRadius:12},{scatterSize:43,cardSize:67,ringSize:56,padding:14,cornerRadius:12,easeBezier:'0.2,-0.7,0.8,1.7'}])for(const n of [5,8,12])for(const [w,h] of [[1280,720],[390,844]])for(const p of [0,.06,.12,.18,.24,.31,.51,.62,.74,.81,.83,.93,.999])compare(m.config({...cfg,...variant,frameRatio:'auto',cardRatio:'auto'}),n,w,h,p);
for(const n of [5,8,12]){assert.deepEqual(plain(pose(0,{},n)),plain(pose(1,{},n)));const seen=new Set;for(let i=0;i<100;i++)for(const c of pose(i/100,{},n))if(c.visible)seen.add(c.slot);assert.equal(seen.size,n);assert.equal(pose(.06,{},n).filter(c=>c.visible).length,5);}
for(const p of [.06,.51,.93]){const tiles=pose(p).flatMap(c=>c.instances).sort((a,b)=>a.depth-b.depth);assert.equal(tiles.at(-1).source,0);}
for(const p of [.04,.13,.51,.94]){const a=pose(p,{frameRatio:'auto'}),b=pose(p,{frameRatio:'auto'},8,2560,1440);for(let i=0;i<a.length;i++)for(let j=0;j<a[i].instances.length;j++){const x=a[i].instances[j],y=b[i].instances[j];near(y.center.x,x.center.x*2);near(y.center.y,x.center.y*2);near(y.cardScale,x.cardScale);}}
for(const easeBezier of ['0.2,-100000,0.8,100000','0.2,100000,0.8,-100000','Infinity,0,0,1','bad'])for(const p of [.04,.13,.24,.51,.79,.94]){const tiles=pose(p,{easeBezier}).flatMap(c=>c.instances);assert.ok(tiles.length<=12);for(const t of tiles)assert.ok(t.polygon.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));}
const scroll={start:20,end:80,turns:3};assert.equal(m.phase(.5,{...cfg,...scroll},true),1.5);assert.deepEqual(plain(m.layout(390,844,{...cfg,...scroll},.1,8,1.6,true)),plain(m.layout(390,844,{...cfg,...scroll},.9,8,1.6,true)));assert.deepEqual(plain(scope.window.NAGWEB_CREATE_STREAM_MODEL().layout(1280,720,cfg,.317,8,1.6)),plain(pose(.317)));
// Transform the independent HAR rectangles before clipping. Linear timing lets
// this oracle compute the vertical envelope without production easing helpers.
let pathComparisons=0;
for(const n of [5,8,12])for(const [w,h] of [[1280,720],[390,844]])for(const direction of ['cw','ccw'])for(const ringTravel of [-100,-45,0,35,100])for(const clock of [94,102,126,180,230,310,390,400,415,430,441]){
 const c=m.config({...cfg,frameRatio:'auto',easing:'linear',direction,ringTravel}),p=clock/532,t=clock-90,pad=Math.min(w,h)*c.padding/100,half=h/2-pad,envelope=Math.max(0,Math.min(1,(t-16)/74))-Math.max(0,Math.min(1,(t-290)/34)),oldCenter=h/2+half*envelope;
 const ref=scatterReference({width:w,height:h,t:p,params:{...c,cardAspect:c.cardRatio},images:Array(n),imageRatio:1.6}).map(r=>{
  let x=r.x+r.w/2,y=r.y+r.h/2;
  if(direction==='ccw'){const axis=-r.slot*2*Math.PI/n,dx=x-w/2,dy=y-oldCenter,co=Math.cos(2*axis),si=Math.sin(2*axis);x=w/2+co*dx+si*dy;y=oldCenter+si*dx-co*dy;}
  y+=half*envelope*(ringTravel/100-1);return {...r,x:x-r.w/2,y:y-r.h/2};
 }).filter(r=>r.x+r.w>0&&r.x<w&&r.y+r.h>0&&r.y<h);
 const actual=pose(p,c,n,w,h).flatMap(card=>card.instances.map(tile=>({slot:card.slot,tile}))).sort((a,b)=>a.tile.depth-b.tile.depth);
 assert.equal(actual.length,ref.length,JSON.stringify({n,w,h,direction,ringTravel,clock}));
 for(let i=0;i<ref.length;i++){const r=ref[i],{slot,tile}=actual[i];assert.equal(slot,r.slot);near(tile.center.x,r.x+r.w/2);near(tile.center.y,r.y+r.h/2);near(tile.mesh.width*tile.cardScale,r.w);near(tile.mesh.height*tile.cardScale,r.h);assert.ok(m.meshUV(tile.mesh,tile.center.x,tile.center.y));pathComparisons++;}
}
for(const direction of ['cw','ccw'])for(const ringTravel of [-100,0,100]){
 const c={direction,ringTravel};for(const p of [0,.06,.12,.93,.999])assert.deepEqual(plain(pose(p,c)),plain(pose(p)),'Ring options do not alter scatter paths');
 assert.deepEqual(plain(pose(0,c)),plain(pose(1,c)));
 for(const easing of Object.keys(m.sweepEasings))for(const p of [.19,.28,.51,.75,.81])for(const tile of pose(p,{...c,easing}).flatMap(card=>card.instances))assert.ok(tile.polygon.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)));
 const cScroll={...cfg,...scroll,...c};assert.deepEqual(plain(m.layout(390,844,cScroll,.1,8,1.6,true)),plain(m.layout(390,844,cScroll,.9,8,1.6,true)));
 assert.deepEqual(plain(scope.window.NAGWEB_CREATE_STREAM_MODEL().layout(1280,720,{...cfg,...c},.317,8,1.6)),plain(pose(.317,c)));
}
console.log('Scatter Dial path customization: '+pathComparisons+' independent planes, clockwise/counterclockwise, upward/centered/downward travel, scatter paths preserved, loop/easings/scroll/exported factory OK');
console.log('Scatter Dial: independent HAR oracle ('+comparisons+' planes), five scatter paths and all-source ring/four ticks/bottom descent/return, 12 easings/custom curve/scaled corners/stable textures/inverse picking, 5–12 sources/extremes/mobile/scroll/exported factory OK');
