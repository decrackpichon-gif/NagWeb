import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {gridStripReference} from './fixtures/animos-grid-strip-reference.mjs';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const m=scope.window.NAGWEB_STREAM_MODEL,cfg=m.config({kind:'grid-zoom-strip'}),plain=x=>JSON.parse(JSON.stringify(x)),pose=(p,c={},w=1280,h=720,n=9)=>m.layout(w,h,{...cfg,...c},p,n,1.6),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,a+' != '+b);
assert.equal(cfg.kind,'grid-zoom-strip');assert.equal(cfg.zoom,2);assert.equal(cfg.gridGap,2);assert.equal(cfg.padding,6);assert.equal(cfg.cornerRadius,3);assert.equal(cfg.cardRatio,'frame');assert.equal(cfg.direction,'horizontal');assert.equal(cfg.focusMode,'start');assert.equal(cfg.movement,'smooth');assert.equal(cfg.fade,false);
for(const [key,s] of Object.entries(m.gridStripSpecs)){assert.equal(cfg[key],s[0]);assert.equal(m.config({kind:cfg.kind,[key]:-999})[key],s[1]);assert.equal(m.config({kind:cfg.kind,[key]:999})[key],s[2]);}
for(const n of [0,4,9,99])assert.equal(pose(0,{},1280,720,n).length,9);
const invalid=m.config({kind:cfg.kind,direction:'bad',focusMode:'bad',movement:'bad',cardRatio:'bad'});assert.equal(invalid.direction,'horizontal');assert.equal(invalid.focusMode,'start');assert.equal(invalid.movement,'smooth');assert.equal(invalid.cardRatio,'frame');
let comparisons=0;
for(const direction of ['horizontal','vertical'])for(const focusMode of ['start','center'])for(const movement of ['smooth','stepped'])for(const fade of [false,true])for(const cardRatio of ['frame','auto','1:1','16:9','9:16'])for(const [w,h] of [[1280,720],[390,844]])for(const progress of [0,.08,.16,.239,.24,.31,.51,.779,.78,.9,.999]){
 const c=m.config({...cfg,direction,focusMode,movement,fade,cardRatio,frameRatio:'auto'}),cards=pose(progress,c,w,h),r=gridStripReference({width:w,height:h,t:(progress%1+1)%1,params:{...c,cardAspect:c.cardRatio},imageRatio:1.6}).filter(t=>t.x+t.w>0&&t.x<w&&t.y+t.h>0&&t.y<h),actual=cards.flatMap(card=>card.instances.map(t=>({slot:card.slot,t})));
 assert.equal(actual.length,r.length);
 for(let j=0;j<r.length;j++){const {slot,t}=actual[j],o=r[j];assert.equal(slot,o.slot);near(t.center.x,o.x+o.w/2);near(t.center.y,o.y+o.h/2);near(t.alpha,o.alpha);near(t.homography.matrix[0]*t.mesh.width,o.w);near(t.homography.matrix[4]*t.mesh.height,o.h);near(t.clipRounded.radius,Math.min(o.radius,o.w/2,o.h/2));assert.equal(t.shade,1);
 for(const v of t.mesh.vertices){near(v.x,o.x+v.u*o.w);near(v.y,o.y+v.v*o.h);const uv=m.projectPlane(t.homography.inverse,v.x,v.y);near(uv.x,v.u*t.mesh.width);near(uv.y,v.v*t.mesh.height);}
 const hit=m.meshUV(t.mesh,t.center.x,t.center.y);assert.ok(hit);near(hit.u,.5);near(hit.v,.5);comparisons++;}
 assert.deepEqual(plain(cards.map(c=>[c.textureWidth,c.textureHeight])),plain(pose(0,c,w,h).map(c=>[c.textureWidth,c.textureHeight])));
}
for(const direction of ['horizontal','vertical'])for(const focusMode of ['start','center'])for(const movement of ['smooth','stepped'])for(const fade of [false,true]){
 const c={direction,focusMode,movement,fade};assert.deepEqual(plain(pose(0,c)),plain(pose(1,c)));const seen=new Set;for(let p=0;p<1;p+=.005)for(const card of pose(p,c))if(card.visible)seen.add(card.slot);assert.equal(seen.size,9);
}
const before=pose(.12)[0],after=pose(.2)[0];near(before.instances[0].clipRounded.radius,21.6);near(after.instances[0].clipRounded.radius,21.6);assert.ok(after.instances[0].homography.matrix[0]>before.instances[0].homography.matrix[0]);assert.equal(before.corner,0);
const transition=pose(.16,{fade:true});assert.equal(transition[0].instances.length,1);assert.equal(transition[0].instances[0].alpha,1);assert.ok(transition.some(c=>c.instances.length===2));for(const card of transition.filter(c=>c.instances.length===2))near(card.instances.reduce((a,t)=>a+t.alpha,0),1);
const stepProgress=.24+.54*(.2/8),held=pose(stepProgress,{movement:'stepped'})[0];near(held.stripPosition,0);assert.ok(pose(stepProgress,{movement:'smooth'})[0].stripPosition>0);
for(const cardRatio of ['frame','auto','1:1','4:3','3:4','4:5','16:9','9:16'])for(const frameRatio of ['16:9','9:16'])for(const zoom of [1.2,3])for(const gridGap of [0,8])for(const progress of [0,.16,.51,.9]){const cards=pose(progress,{cardRatio,frameRatio,zoom,gridGap,padding:20,cornerRadius:12,fade:true},390,844);assert.ok(cards.some(c=>c.visible));for(const c of cards)for(const t of c.instances){assert.ok(t.width>0&&t.height>0);for(const v of t.mesh.vertices)assert.ok(Number.isFinite(v.x)&&Number.isFinite(v.y));assert.ok(t.clipRounded.radius<=Math.min(t.rounded.width,t.rounded.height)/2+1e-5);}}
const rounded=pose(0,{cornerRadius:12})[0].instances[0],p=m.meshPoint(rounded.mesh,.005,.005);assert.equal(m.meshUV(rounded.mesh,p.x,p.y),null);assert.ok(m.meshUV(rounded.mesh,rounded.center.x,rounded.center.y));
const scroll={start:20,end:80,turns:3};assert.equal(m.phase(.5,{...cfg,...scroll},true),1.5);assert.deepEqual(plain(m.layout(390,844,{...cfg,...scroll},.1,9,1.6,true)),plain(m.layout(390,844,{...cfg,...scroll},.9,9,1.6,true)));
assert.deepEqual(plain(scope.window.NAGWEB_CREATE_STREAM_MODEL().layout(1280,720,cfg,.317,9,1.6)),plain(pose(.317)));
console.log('Grid Zoom Strip: original HAR oracle ('+comparisons+' rectangles), fixed 3×3 grid, capped zoom/spacing/aspect, horizontal/vertical/start/center, smooth/stepped holds, separate fade copies and focus morph, constant screen corner radius/inverse picking, closed cycle/every source/stable textures/extremes/mobile/scroll/exported factory OK');
