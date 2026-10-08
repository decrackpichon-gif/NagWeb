import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),defaults=model.config({kind:'cascade-deck'}),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`),pose=(p,c={},n=8,w=1280,h=720,ratio=1)=>plain(model.layout(w,h,{...defaults,...c},p,n,ratio)),center=c=>({x:(c.upper[0].x+c.lower[1].x)/2,y:(c.upper[0].y+c.lower[1].y)/2}),distance=c=>Math.hypot(center(c).x-640,center(c).y-360);
for(const [key,s] of Object.entries(model.cascadeDeckSpecs)){assert.equal(defaults[key],s[0]);assert.equal(model.config({kind:'cascade-deck',[key]:999})[key],s[2]);assert.equal(model.config({kind:'cascade-deck',[key]:-999})[key],s[1]);}
assert.equal(defaults.kind,'cascade-deck');assert.equal(defaults.motion,'staggered');assert.equal(defaults.cardRatio,'1:1');assert.equal(model.config({kind:'cascade-deck',motion:'together'}).motion,'together');assert.equal(model.config({kind:'cascade-deck',motion:'bad'}).motion,'staggered');assert.equal(pose(0,{},1).length,3);assert.equal(pose(0,{},999).length,12);
for(const n of [3,8,12]){
 const first=pose(0,{},n),open=pose(.18,{},n),yFlipped=pose(.43,{},n),both=pose(.70,{},n),gap=open[0].textureWidth*.3;
 assert.deepEqual(first,pose(1,{},n));assert.deepEqual(open,pose(.21,{},n));assert.deepEqual(yFlipped,pose(.46,{},n));assert.deepEqual(both,pose(.73,{},n));
 for(let i=0;i<n;i++){
  const a=center(first[i]),b=center(open[i]),c=center(yFlipped[i]),d=center(both[i]);near(a.x,640);near(a.y,360);near(b.x-640,(i-(n-1)/2)*gap);near(b.y-360,b.x-640);near(c.x,b.x);near(c.y,720-b.y);near(d.x,1280-b.x);near(d.y,c.y);assert.equal(open[i].depth,n-1-i);assert.equal(open[i].instances[0].depth,n-1-i);
  const end=center(pose(1-1e-7,{},n)[i]);near(end.x,640);near(end.y,360);
 }
 // The square image plus all inter-card offsets occupies exactly the chosen fraction of the usable side.
 near(open[0].textureWidth+gap*(n-1),Math.min(open[0].clip.width,open[0].clip.height)*.8);
 const a=pose(.03,{},n),b=pose(.03,{motion:'together'},n);assert.ok(distance(a[0])>distance(b[0]));near(distance(a[n-1]),0);assert.ok(distance(b[n-1])>0);
 const closing=pose(.79,{},n);assert.ok(distance(closing[0])<distance(both[0]));near(distance(closing[n-1]),distance(both[n-1]));
 // Vertical swap starts at source zero; horizontal swap starts at the last source.
 const yStart=pose(.23,{},n),xStart=pose(.48,{},n);assert.ok(center(yStart[0]).y>center(open[0]).y);near(center(yStart[n-1]).y,center(open[n-1]).y);assert.ok(center(xStart[n-1]).x<center(open[n-1]).x);near(center(xStart[0]).x,center(open[0]).x);
}
const mid=pose(.31,{motion:'together'});for(const c of mid)near(center(c).y,360);
const xMid=pose(.56,{motion:'together'});for(const c of xMid)near(center(c).x,640);
for(const n of [3,8,12])for(const motion of ['staggered','together'])for(const overlap of [40,70,85])for(const cardRatio of ['auto','1:1','16:9','9:16'])for(const [w,h,ratio] of [[1280,720,.25],[390,844,4]]){
 const cfg={motion,overlap,cardRatio,cardSize:100,cornerRadius:12,frameRatio:'auto'},start=pose(0,cfg,n,w,h,ratio),seen=new Set();
 for(let sample=0;sample<50;sample++)for(const c of pose(sample/50,cfg,n,w,h,ratio)){
  assert.equal(c.visible,c.instances.length===1);assert.equal(c.alpha,c.visible?1:0);assert.ok(c.width>0&&c.width<=w+1e-6&&c.height>0&&c.height<=h+1e-6);assert.deepEqual([c.textureWidth,c.textureHeight,c.corner],[start[c.slot].textureWidth,start[c.slot].textureHeight,start[c.slot].corner]);assert.ok(c.upper.concat(c.lower).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));assert.ok(c.textureWidth<=Math.min(c.clip.width,c.clip.height)&&c.textureHeight<=Math.min(c.clip.width,c.clip.height));
  for(const t of c.instances){seen.add(c.slot);near(t.rounded.width,c.textureWidth);near(t.rounded.height,c.textureHeight);near(t.rounded.radius,c.corner);assert.equal(t.rounded.angle,0);assert.equal(t.depth,n-1-c.slot);assert.ok(t.rounded.radius<=Math.min(t.rounded.width,t.rounded.height)/2+1e-6);near(t.upper[0].x,t.upper[1].x);near(t.lower[0].x,t.lower[1].x);}
 }assert.equal(seen.size,n);
}
const a=pose(.18),scaled=pose(.18,{},8,2560,1440),offset=pose(.18,{offsetX:4,offsetY:-3});for(let i=0;i<8;i++){const x=a[i].instances[0].rounded,y=scaled[i].instances[0].rounded,z=offset[i].instances[0].rounded;for(const k of ['cx','cy','width','height','radius'])near(y[k],x[k]*2);near(z.cx-x.cx,28.8);near(z.cy-x.cy,-21.6);}
for(const offsetX of [-50,50])for(const offsetY of [-50,50])for(const c of pose(.5,{offsetX,offsetY,cardSize:100,overlap:40,cardRatio:'auto'},12,390,844,.25)){assert.ok(c.width>=1&&c.height>=1);assert.ok(c.upper.concat(c.lower).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));}
const scroll={...defaults,turns:3,start:20,end:80};assert.deepEqual(plain(model.layout(1280,720,scroll,.1,8,1,true)),plain(model.layout(1280,720,scroll,.9,8,1,true)));
const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,12,1,true)),plain(model.layout(390,844,scroll,.317,12,1,true)));
console.log('Cascade Deck: defaults/bounds, 3–12 sources, stack/spread/axis swaps/restack, simultaneous/staggered timing and reversed horizontal order, pauses/loop, overlap/fitted aspect/size, first source in front, bounded geometry/stable textures, scale/offsets, scroll and exported factory OK');
