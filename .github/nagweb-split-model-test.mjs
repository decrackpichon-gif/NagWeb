import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),defaults=model.config({kind:'split-reveal'}),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`),pose=(p,c={},w=1280,h=720)=>plain(model.layout(w,h,{...defaults,...c},p,4,1));
for(const [key,s] of Object.entries(model.splitSpecs)){assert.equal(defaults[key],s[0]);assert.equal(model.config({kind:'split-reveal',[key]:999})[key],s[2]);assert.equal(model.config({kind:'split-reveal',[key]:-999})[key],s[1]);}
assert.equal(defaults.kind,'split-reveal');assert.equal(defaults.cardRatio,'frame');assert.equal(model.config({kind:'split-reveal',cardRatio:'auto'}).cardRatio,'frame');
for(const count of [0,1,4,99])assert.equal(model.layout(1280,720,defaults,.125,count,.25).length,4);
const first=pose(.125),unit=7.2,pad=unit*6,w=1280-2*pad,h=720-2*pad,gap=unit*2;
assert.ok(first.every(c=>!c.vertical));near(first[0].textureWidth,w/2-gap/2);near(first[0].textureHeight,h);near(first[0].reveal,.5);near(first[1].reveal,4*.34**3);
near(first[0].upper[0].x,pad-first[0].textureWidth/2);near(first[1].upper[0].x,640+gap/2+first[1].textureWidth*(1-first[1].reveal));assert.equal(first[2].arriving,false);near(first[2].upper[0].x,pad);
// Static window corners and crop dimensions never follow the moving image plane.
for(const slot of [0,1]){const moving=first[slot].instances[0],base=first[slot+2].instances[0];assert.deepEqual(moving.panelClip,base.panelClip);assert.notDeepEqual(moving.upper,base.upper);assert.equal(first[slot].corner,0);assert.equal(moving.rounded.radius,unit*3);assert.ok(moving.depth>base.depth);}
const portrait=pose(.125,{frameRatio:'9:16'},390,844);assert.ok(portrait.every(c=>c.vertical));near(portrait[0].upper[0].x,portrait[2].upper[0].x);near(portrait[0].upper[0].y,portrait[2].upper[0].y-portrait[0].textureHeight/2);assert.ok(portrait[1].upper[0].y>portrait[3].upper[0].y);
for(const [w,h,expected] of [[1000,1050,false],[1000,1051,true]])assert.equal(pose(.1,{frameRatio:'auto'},w,h)[0].vertical,expected);
function sourceAt(cards,panel,fraction=.5){const window=cards.find(c=>c.panel===panel&&c.instances.length).instances[0].panelClip,x=window.cx+(fraction-.5)*window.width,y=window.cy;return cards.filter(c=>c.panel===panel&&c.instances.some(t=>x>t.polygon[0].x&&x<t.polygon[2].x&&y>t.polygon[0].y&&y<t.polygon[2].y)).sort((a,b)=>b.depth-a.depth)[0]?.slot;}
for(const [p,expected] of [[0,[2,3]],[.3,[0,1]],[.49,[0,1]],[.5,[0,1]],[.8,[2,3]],[.99,[2,3]],[1,[2,3]]])for(let panel=0;panel<2;panel++)assert.equal(sourceAt(pose(p),panel),expected[panel]);
for(const p of [0,.5,1]){const c=pose(p);assert.equal(c.filter(n=>n.instances.length).length,2);assert.ok(c.filter(n=>!n.instances.length).every(n=>n.alpha===0&&!n.visible));}
for(const p of [.3,.4,.49])assert.deepEqual(pose(p),pose(.3));for(const p of [.8,.9,.99])assert.deepEqual(pose(p),pose(.8));assert.deepEqual(pose(0),pose(1));
for(const boundary of [.5,1])for(const fraction of [.01,.5,.99])for(let panel=0;panel<2;panel++)assert.equal(sourceAt(pose(boundary-1e-7),panel,fraction),sourceAt(pose(boundary),panel,fraction));
for(const frameRatio of ['auto','1:1','16:9','9:16'])for(const splitRatio of [30,50,70])for(const gap of [0,2,8])for(const cornerRadius of [0,3,12])for(const padding of [0,6,20])for(const [w,h] of [[1280,720],[390,844]]){
 const cfg={frameRatio,splitRatio,gap,cornerRadius,padding},seen=new Set(),a=pose(0,cfg,w,h);
 for(let sample=0;sample<20;sample++)for(const c of pose(sample/20,cfg,w,h)){
  assert.ok(c.textureWidth>0&&c.textureHeight>0);assert.deepEqual([c.textureWidth,c.textureHeight,c.corner],[a[c.slot].textureWidth,a[c.slot].textureHeight,0]);assert.equal(c.visible,c.instances.length===1);assert.equal(c.alpha,c.visible?1:0);assert.ok(c.width>0&&c.width<=w&&c.height>0&&c.height<=h);assert.ok(c.upper.concat(c.lower).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  for(const t of c.instances){seen.add(c.slot);assert.deepEqual(t.rounded,t.panelClip);assert.ok(t.rounded.radius<=Math.min(t.rounded.width,t.rounded.height)/2);for(const p of t.polygon){assert.ok(p.x>=c.clip.left-1e-6&&p.x<=c.clip.left+c.clip.width+1e-6&&p.y>=c.clip.top-1e-6&&p.y<=c.clip.top+c.clip.height+1e-6);assert.ok(p.x>=t.rounded.cx-t.rounded.width/2-1e-6&&p.x<=t.rounded.cx+t.rounded.width/2+1e-6&&p.y>=t.rounded.cy-t.rounded.height/2-1e-6&&p.y<=t.rounded.cy+t.rounded.height/2+1e-6);}assert.ok(t.shadowStrength>=0&&t.shadowStrength<=2);}
 }
 assert.equal(seen.size,4);
}
const scaled=pose(.125,{},2560,1440),offset=pose(.125,{offsetX:4,offsetY:-3});for(let i=0;i<4;i++){const a=first[i],b=scaled[i],c=offset[i];near(b.textureWidth,a.textureWidth*2);near(b.textureHeight,a.textureHeight*2);near(c.upper[0].x-a.upper[0].x,28.8);near(c.upper[0].y-a.upper[0].y,-21.6);near(b.upper[0].x,a.upper[0].x*2);near(b.upper[0].y,a.upper[0].y*2);}
for(const offsetX of [-50,50])for(const offsetY of [-50,50])for(const c of pose(.125,{frameRatio:'auto',offsetX,offsetY,splitRatio:70,gap:8},390,844))assert.ok(c.width>=1&&c.height>=1&&c.upper.concat(c.lower).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
const scroll={...defaults,turns:3,start:20,end:80};assert.deepEqual(plain(model.layout(1280,720,scroll,.1,4,1,true)),plain(model.layout(1280,720,scroll,.9,4,1,true)));
const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,4,1,true)),plain(model.layout(390,844,scroll,.317,4,1,true)));
console.log('Split Reveal: defaults/bounds, fixed four sources, adaptive panels, opposite entries/stagger, two pairs/holds/continuous loop, static rounded window/undistorted crop, stable textures, clipped geometry/extremes, scale/offsets, scroll and exported factory OK');
