import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),defaults=model.config({kind:'orbit-showcase'}),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`),pose=(p,c={},n=12,w=1280,h=720,ratio=1)=>plain(model.layout(w,h,{...defaults,...c},p,n,ratio)),rect=c=>c.instances[0].rounded;
for(const [key,s] of Object.entries(model.showcaseSpecs)){assert.equal(defaults[key],s[0]);assert.equal(model.config({kind:'orbit-showcase',[key]:999})[key],s[2]);assert.equal(model.config({kind:'orbit-showcase',[key]:-999})[key],s[1]);}
assert.equal(defaults.kind,'orbit-showcase');assert.equal(defaults.motion,'linear');assert.equal(defaults.direction,'right');assert.equal(defaults.cardRatio,'1:1');assert.equal(model.config({kind:'orbit-showcase',motion:'steps'}).motion,'linear');assert.equal(pose(0,{},1).length,4);assert.equal(pose(0,{},999).length,16);
const a=pose(0),front=a[0],rear=a[6],side=a[3];near(front.alpha,1);near(rear.alpha,.55);near(rect(front).width,158.4*1.1925);near(rect(rear).width,158.4*.6975);near(rect(front).cx,640);near(rect(front).cy,360+(720-86.4)*.26/2);near(rect(rear).cy,720-rect(front).cy);near(rect(side).cx,640+(1280-86.4)*.64/2);near(side.alpha,.775);assert.ok(front.depth>rear.depth);assert.deepEqual(a,pose(1));
for(const direction of ['left','right'])for(const motion of ['linear','pulse'])for(const n of [4,12,16]){
 const cfg={direction,motion,pulse:90};assert.deepEqual(pose(0,cfg,n),pose(1,cfg,n));
 // Every source reaches the same front scale and full opacity once each loop.
 for(let slot=0;slot<n;slot++){const target=direction==='right'?(1-slot/n)%1:slot/n;let lo=0,hi=1;for(let i=0;i<60;i++){const mid=(lo+hi)/2,travel=mid+(motion==='pulse'?.9*Math.sin(mid*Math.PI*2)/(Math.PI*2):0);if(travel<target)lo=mid;else hi=mid;}const card=pose((lo+hi)/2,cfg,n)[slot];near(card.alpha,1);near(rect(card).width,158.4*1.1925);}
}
for(const p of [.11,.27,.68]){const a=pose(p),b=pose(1-p,{direction:'left'});for(let i=0;i<12;i++){const x=rect(a[i]),y=rect(b[i]);for(const k of ['cx','cy','width','height','radius'])near(x[k],y[k]);near(a[i].alpha,b[i].alpha);}}
// Tilt rotates the orbit centers, while the cards remain upright and retain depth/scale/fade.
for(const ringTilt of [-45,45]){const tilted=pose(.17,{ringTilt}),base=pose(.17),r=ringTilt*Math.PI/180;for(let i=0;i<12;i++){const a=rect(base[i]),b=rect(tilted[i]),x=a.cx-640,y=a.cy-360;near(b.cx-640,x*Math.cos(r)-y*Math.sin(r));near(b.cy-360,x*Math.sin(r)+y*Math.cos(r));near(a.width,b.width);near(base[i].alpha,tilted[i].alpha);near(base[i].depth,tilted[i].depth);assert.equal(b.angle,0);}}
for(const spread of [0,50]){const b=pose(.17,{spread}),a=pose(.17);for(let i=0;i<12;i++){const x=rect(a[i]),y=rect(b[i]);near(y.cx-640,(x.cx-640)*spread/100);near(y.cy-360,(x.cy-360)*spread/100);near(y.width,x.width);near(y.radius,x.radius);near(b[i].alpha,a[i].alpha);}}
const flat=pose(.17,{perspective:0,backFade:0});for(const c of flat){near(rect(c).width,158.4);near(c.alpha,1);}assert.notEqual(flat[0].depth,flat[6].depth);
for(const n of [4,12,16])for(const perspective of [0,55,100])for(const backFade of [0,90])for(const spread of [0,100])for(const cardRatio of ['auto','1:1','16:9','9:16'])for(const [w,h,ratio] of [[1280,720,.25],[390,844,4]]){
 const cfg={perspective,backFade,spread,cardRatio,cardSize:34,ringWidth:90,ringHeight:60,ringTilt:45,cornerRadius:12,frameRatio:'auto'},start=pose(0,cfg,n,w,h,ratio),seen=new Set();
 for(let sample=0;sample<24;sample++)for(const c of pose(sample/24,cfg,n,w,h,ratio)){
  assert.equal(c.visible,c.instances.length===1);assert.ok(c.alpha>=0&&c.alpha<=1);assert.ok(c.width>0&&c.width<=w+1e-6&&c.height>0&&c.height<=h+1e-6);assert.deepEqual([c.textureWidth,c.textureHeight,c.corner],[start[c.slot].textureWidth,start[c.slot].textureHeight,start[c.slot].corner]);assert.ok(c.upper.concat(c.lower).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  for(const t of c.instances){seen.add(c.slot);assert.ok(t.scale>=.45-1e-6&&t.scale<=1.35+1e-6);near(t.rounded.width,c.textureWidth*t.scale);near(t.rounded.height,c.textureHeight*t.scale);near(t.rounded.radius,c.corner*t.scale);near(t.depth,c.depth);near(t.alpha,c.alpha);assert.equal(t.rounded.angle,0);assert.ok(t.rounded.radius<=Math.min(t.rounded.width,t.rounded.height)/2+1e-6);near(t.upper[0].x,t.upper[1].x);near(t.lower[0].x,t.lower[1].x);}
 }assert.equal(seen.size,n);
}
const base=pose(.17),scaled=pose(.17,{},12,2560,1440),offset=pose(.17,{offsetX:4,offsetY:-3});for(let i=0;i<12;i++){const a=rect(base[i]),b=rect(scaled[i]),c=rect(offset[i]);for(const k of ['cx','cy','width','height','radius'])near(b[k],a[k]*2);near(c.cx-a.cx,28.8);near(c.cy-a.cy,-21.6);}
const centers=pose(0,{spread:0,perspective:0,backFade:0});assert.equal(centers.reduce((a,b)=>a.depth>b.depth?a:b).slot,0);assert.equal(pose(.5,{spread:0,perspective:0,backFade:0}).reduce((a,b)=>a.depth>b.depth?a:b).slot,6);
const scroll={...defaults,turns:3,start:20,end:80};assert.deepEqual(plain(model.layout(1280,720,scroll,.1,12,1,true)),plain(model.layout(1280,720,scroll,.9,12,1,true)));
const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,16,1,true)),plain(model.layout(390,844,scroll,.317,16,1,true)));
console.log('Orbit Showcase: defaults/bounds, 4–16 sources, linear/pulse in both directions, every source in front, scale/depth/fade, independent tilt/spread, collapsed orbit front order, ratios/bounded geometry/stable textures, loop/scale/offsets, scroll and exported factory OK');
