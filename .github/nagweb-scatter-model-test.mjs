import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {scatterReference} from './fixtures/animos-scatter-reference.mjs';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const m=scope.window.NAGWEB_STREAM_MODEL,cfg=m.config({kind:'scatter-dial'}),plain=x=>JSON.parse(JSON.stringify(x)),pose=(p,c={},n=8,w=1280,h=720)=>m.layout(w,h,{...cfg,...c},p,n,1.6),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,a+' != '+b);
assert.equal(cfg.kind,'scatter-dial');assert.equal(cfg.cardRatio,'16:9');assert.equal(cfg.padding,6);assert.equal(cfg.cornerRadius,3);assert.equal(cfg.easing,'custom');assert.equal(cfg.easeBezier,'0.84,0,0.16,1');assert.equal(cfg.motion,'continuous');
for(const [key,s] of Object.entries(m.scatterSpecs)){assert.equal(cfg[key],s[0]);assert.equal(m.config({kind:cfg.kind,[key]:-999})[key],s[1]);assert.equal(m.config({kind:cfg.kind,[key]:999})[key],s[2]);assert.equal(m.config({kind:cfg.kind,[key]:NaN})[key],s[0]);}
assert.equal(m.config({...cfg,easing:'__proto__'}).easing,'custom');assert.equal(m.config({...cfg,cardRatio:'frame'}).cardRatio,'16:9');
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
console.log('Scatter Dial: independent HAR oracle ('+comparisons+' planes), five scatter paths and all-source ring/four ticks/bottom descent/return, 12 easings/custom curve/scaled corners/stable textures/inverse picking, 5–12 sources/extremes/mobile/scroll/exported factory OK');
