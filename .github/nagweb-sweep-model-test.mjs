import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {sweepReference,sweepEaseReference} from './fixtures/animos-sweep-reference.mjs';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const m=scope.window.NAGWEB_STREAM_MODEL,cfg=m.config({kind:'sweep-ring'}),plain=x=>JSON.parse(JSON.stringify(x)),pose=(p,c={},n=8,w=1280,h=720)=>m.layout(w,h,{...cfg,...c},p,n,1.6),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,a+' != '+b);
assert.equal(cfg.kind,'sweep-ring');assert.equal(cfg.cardRatio,'16:9');assert.equal(cfg.padding,6);assert.equal(cfg.cornerRadius,3);assert.equal(cfg.easing,'custom');assert.equal(cfg.easeBezier,'0.88,0.14,0.12,0.86');assert.equal(cfg.motion,'continuous');
for(const [key,s] of Object.entries(m.sweepSpecs)){assert.equal(cfg[key],s[0]);assert.equal(m.config({kind:cfg.kind,[key]:-999})[key],s[1]);assert.equal(m.config({kind:cfg.kind,[key]:999})[key],s[2]);assert.equal(m.config({kind:cfg.kind,[key]:NaN})[key],s[0]);}
assert.equal(m.config({...cfg,easing:'__proto__'}).easing,'custom');assert.equal(m.config({...cfg,cardRatio:'frame'}).cardRatio,'16:9');
for(const [n,expected] of [[0,8],[1,3],[3,3],[16,16],[99,16]])assert.equal(pose(0,{},n).length,expected);
for(const name of Object.keys(m.sweepEasings))for(const curve of [cfg.easeBezier,'0.2,-0.7,0.8,1.7','-2,0,3,1','bad'])for(let i=0;i<=100;i++)near(m.sweepEase(name,curve)(i/100),sweepEaseReference(name,60,curve)(i/100));
for(const curve of ['NaN,0,1,1','0,Infinity,1,1','0,1e300,1,0',''])for(let i=0;i<=100;i++)assert.ok(Number.isFinite(m.sweepEase('custom',curve)(i/100)));
let comparisons=0;
for(const easing of Object.keys(m.sweepEasings))for(const n of [3,8,16])for(const cardRatio of ['auto','16:9','3:4'])for(const [w,h] of [[1280,720],[390,844]]){
 const c=m.config({...cfg,easing,cardRatio,frameRatio:'auto'}),rowSpan=140+(n-2)*25,total=rowSpan+270;
 const phases=[0,.08,.16,.35,.5,.58,.72,.88,.93,.99999,...[20,50,60,90,100,100+(n-2)*25,rowSpan,rowSpan+30,rowSpan+210,rowSpan+240].map(t=>t/total)];
 for(const progress of phases){const cards=pose(progress,c,n,w,h),ref=sweepReference({width:w,height:h,t:(progress%1+1)%1,params:{...c,cardAspect:c.cardRatio},images:Array(n),imageRatio:1.6}).filter(t=>t.x+t.w>0&&t.x<w&&t.y+t.h>0&&t.y<h),actual=cards.flatMap(card=>card.instances.map(t=>({slot:card.slot,t}))).sort((a,b)=>a.t.depth-b.t.depth);
  assert.equal(actual.length,ref.length,easing+' '+n+' '+progress);for(let j=0;j<ref.length;j++){const r=ref[j],{slot,t}=actual[j];assert.equal(slot,r.slot);assert.equal(t.depth,n-1-slot);near(t.center.x,r.x+r.w/2);near(t.center.y,r.y+r.h/2);near(t.mesh.width*t.cardScale,r.w);near(t.mesh.height*t.cardScale,r.h);near(t.planeClipRadius*t.cardScale,r.radius);assert.equal(t.alpha,1);assert.equal(t.shade,1);
   for(const v of t.mesh.vertices){near(v.x,r.x+v.u*r.w);near(v.y,r.y+v.v*r.h);const uv=m.projectPlane(t.homography.inverse,v.x,v.y);near(uv.x,v.u*t.mesh.width);near(uv.y,v.v*t.mesh.height);}assert.ok(m.meshUV(t.mesh,t.center.x,t.center.y));comparisons++;}
  assert.deepEqual(plain(cards.map(c=>[c.textureWidth,c.textureHeight])),plain(pose(.72,c,n,w,h).map(c=>[c.textureWidth,c.textureHeight])));
 }
}
for(const n of [3,8,16]){const seen=new Set;for(let p=0;p<1;p+=.01)for(const c of pose(p,{},n))if(c.visible)seen.add(c.slot);assert.equal(seen.size,n);assert.deepEqual(plain(pose(0,{},n)),plain(pose(1,{},n)));}
const initial=pose(0);assert.ok(initial.every(c=>c.instances[0].cardScale===1));assert.ok(initial.every(c=>c.instances[0].center.x===640&&c.instances[0].center.y===360));assert.ok(pose(.99999)[0].instances[0].cardScale>.9999);
for(const rowCard of [20,100])for(const ringCard of [10,60])for(const ringSize of [10,60])for(const deckDepth of [0,15])for(const easing of ['custom','elastic','impulse','swing'])for(const p of [.04,.13,.42,.57,.94])for(const c of pose(p,{rowCard,ringCard,ringSize,deckDepth,easing,cornerRadius:12,padding:20,frameRatio:'auto'},16,390,844))for(const t of c.instances){assert.ok(t.width>0&&t.height>0&&t.cardScale>0);for(const v of t.mesh.vertices)assert.ok(Number.isFinite(v.x)&&Number.isFinite(v.y));}
const r=pose(.72,{cornerRadius:12,ringCard:10,ringSize:60}).flatMap(c=>c.instances)[0],p=m.meshPoint(r.mesh,.005,.005);assert.equal(m.meshUV(r.mesh,p.x,p.y),null);assert.ok(m.meshUV(r.mesh,r.center.x,r.center.y));
const scroll={start:20,end:80,turns:3};assert.equal(m.phase(.5,{...cfg,...scroll},true),1.5);assert.deepEqual(plain(m.layout(390,844,{...cfg,...scroll},.1,8,1.6,true)),plain(m.layout(390,844,{...cfg,...scroll},.9,8,1.6,true)));assert.deepEqual(plain(scope.window.NAGWEB_CREATE_STREAM_MODEL().layout(1280,720,cfg,.317,8,1.6)),plain(pose(.317)));
console.log('Sweep Ring: independent HAR oracle ('+comparisons+' planes), exact row/ring timing and 12 easings/custom Bézier, source order/scale/corners/inverse picking, stable textures, 3–16 sources/extremes/mobile/scroll/exported factory OK');
