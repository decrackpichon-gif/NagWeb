import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {feedReference} from './fixtures/animos-feed-reference.mjs';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const m=scope.window.NAGWEB_STREAM_MODEL,cfg=m.config({kind:'feed-scroll'}),plain=x=>JSON.parse(JSON.stringify(x)),pose=(p,c={},n=12,w=1280,h=720)=>m.layout(w,h,{...cfg,...c},p,n,1.6),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,a+' != '+b);
assert.equal(cfg.kind,'feed-scroll');assert.equal(cfg.cardRatio,'16:9');assert.equal(cfg.padding,6);assert.equal(cfg.cornerRadius,3);assert.equal(cfg.motion,'flicks');assert.equal(cfg.enter,'fade');
for(const [key,s] of Object.entries(m.feedSpecs)){assert.equal(cfg[key],s[0]);assert.equal(m.config({kind:cfg.kind,[key]:-999})[key],s[1]);assert.equal(m.config({kind:cfg.kind,[key]:999})[key],s[2]);assert.equal(m.config({kind:cfg.kind,[key]:NaN})[key],s[0]);}
assert.equal(m.config({...cfg,motion:'bad'}).motion,'flicks');assert.equal(m.config({...cfg,enter:'bad'}).enter,'fade');assert.equal(m.config({...cfg,cardRatio:'frame'}).cardRatio,'16:9');
for(const [n,expected] of [[0,12],[1,8],[8,8],[16,16],[99,16]])assert.equal(pose(0,{},n).length,expected);
let comparisons=0;
for(const n of [8,9,12,13,16])for(const motion of ['flicks','steady'])for(const enter of ['fade','slide'])for(const cardRatio of ['auto','16:9','3:4','9:16'])for(const [w,h] of [[1280,720],[390,844]])for(const variant of [{},{cardSize:30,spacing:40,lanes:0,move:20,fade:10,stagger:100,padding:20,cornerRadius:12,offsetX:-20,offsetY:10},{cardSize:80,spacing:140,lanes:100,move:100,fade:100,stagger:50,padding:0,cornerRadius:12,offsetX:20,offsetY:-10}]){
 const c=m.config({...cfg,...variant,motion,enter,cardRatio,frameRatio:'auto'});
 for(const p of [0,.001,.08,.23,.51,.79,.9999,...[.1,.2,.225,.3,.65,.8,.95].map(t=>(3+t)/n)]){
  const cards=pose(p,c,n,w,h),clip=cards[0].clip,ref=feedReference({width:w,height:h,t:(p%1+1)%1,params:{...c,cardAspect:c.cardRatio},images:Array(n),imageRatio:1.6}).filter(t=>t.x+t.w>clip.left&&t.x<clip.left+clip.width&&t.y+t.h>clip.top&&t.y<clip.top+clip.height),actual=cards.flatMap(card=>card.instances.map(t=>({slot:card.slot,t})));
  assert.equal(actual.length,ref.length,JSON.stringify({n,motion,enter,cardRatio,w,h,variant,p}));for(let j=0;j<ref.length;j++){const r=ref[j],{slot,t}=actual[j];assert.equal(slot,r.slot);near(t.center.x,r.x+r.w/2);near(t.center.y,r.y+r.h/2);near(t.mesh.width,r.w);near(t.mesh.height,r.h);near(t.alpha,r.alpha);near(t.planeClipRadius,r.radius);assert.equal(t.shade,1);for(const v of t.mesh.vertices){const uv=m.projectPlane(t.homography.inverse,v.x,v.y);near(uv.x,v.u*t.mesh.width);near(uv.y,v.v*t.mesh.height);}assert.ok(m.meshUV(t.mesh,t.center.x,t.center.y));comparisons++;}
  assert.deepEqual(plain(cards.map(c=>[c.textureWidth,c.textureHeight])),plain(pose(.72,c,n,w,h).map(c=>[c.textureWidth,c.textureHeight])));
 }
}
for(const n of [8,9,12,13,16]){assert.deepEqual(plain(pose(0,{},n)),plain(pose(1,{},n)));const slots=new Set;for(let i=0;i<100;i++)for(const c of pose(i/100,{},n))if(c.visible)slots.add(c.slot);assert.equal(slots.size,n);}
assert.notDeepEqual(plain(pose(.31,{motion:'flicks'})),plain(pose(.31,{motion:'steady'})));
assert.notDeepEqual(plain(pose(.27,{stagger:0})),plain(pose(.27,{stagger:100})));
assert.deepEqual(plain(pose(.31,{motion:'steady',enter:'fade',stagger:0,move:20})),plain(pose(.31,{motion:'steady',enter:'slide',stagger:100,move:100})));
for(const p of [.04,.13,.51,.94]){const a=pose(p,{frameRatio:'auto'}),b=pose(p,{frameRatio:'auto'},12,2560,1440);for(let i=0;i<a.length;i++)for(let j=0;j<a[i].instances.length;j++){const x=a[i].instances[j],y=b[i].instances[j];near(y.center.x,x.center.x*2);near(y.center.y,x.center.y*2);near(y.alpha,x.alpha);}}
const scroll={start:20,end:80,turns:3};assert.equal(m.phase(.5,{...cfg,...scroll},true),1.5);assert.deepEqual(plain(m.layout(390,844,{...cfg,...scroll},.1,12,1.6,true)),plain(m.layout(390,844,{...cfg,...scroll},.9,12,1.6,true)));assert.deepEqual(plain(scope.window.NAGWEB_CREATE_STREAM_MODEL().layout(1280,720,cfg,.317,12,1.6)),plain(pose(.317)));
console.log('Feed Scroll: independent HAR oracle ('+comparisons+' planes), alternating pitches/odd source lanes, flicks/steady/fade/slide/stagger, physical corners/stable textures/inverse picking, 8–16 sources/extremes/offsets/mobile/scroll/exported factory OK');
