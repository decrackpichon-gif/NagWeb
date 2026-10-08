import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),defaults=model.config({kind:'stripe-reveal'}),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`),pose=(p,c={},n=3,w=1280,h=720)=>plain(model.layout(w,h,{...defaults,...c},p,n,1));
for(const [key,s] of Object.entries(model.stripeSpecs)){assert.equal(defaults[key],s[0]);assert.equal(model.config({kind:'stripe-reveal',[key]:999})[key],s[2]);assert.equal(model.config({kind:'stripe-reveal',[key]:-999})[key],s[1]);}
assert.equal(model.config({kind:'stripe-reveal',strips:7.6}).strips,8);assert.equal(defaults.cardRatio,'frame');assert.equal(model.config({kind:'stripe-reveal',cardRatio:'auto'}).cardRatio,'frame');
function inside(poly,x,y){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
function topAt(cards,x,y){return cards.flatMap(c=>c.instances.map(t=>({...t,slot:c.slot}))).filter(t=>inside(t.polygon,x,y)).sort((a,b)=>b.depth-a.depth)[0]?.slot;}
for(const [input,expected] of [[0,3],[1,2],[3,3],[99,8]])assert.equal(model.layout(1280,720,defaults,.08,input,.25).length,expected);
for(const n of [2,3,8]){
 for(let slot=0;slot<n;slot++){
  const start=pose(slot/n,{},n);assert.deepEqual(start.filter(c=>c.visible).map(c=>c.slot),[(slot+n-1)%n]);
  for(const local of [.5,.75,.99])assert.deepEqual(pose((slot+local)/n,{},n).filter(c=>c.visible).map(c=>c.slot),[slot]);
 }
 assert.deepEqual(pose(0,{},n),pose(1,{},n));
 for(let boundary=1;boundary<=n;boundary++){const before=pose(boundary/n-1e-7,{},n),after=pose(boundary/n,{},n);for(const [x,y] of [[100,100],[640,360],[1100,600]])assert.equal(topAt(before,x,y),topAt(after,x,y));}
}
for(const [w,h] of [[1280,720],[390,844]])for(const strips of [3,7,14]){
 const frameRatio='auto',a=pose(.25/3,{frameRatio,strips},3,w,h),current=a[0],previous=a[2],r=previous.instances[0].rounded,vertical=h<=w*1.05;assert.equal(current.vertical,vertical);assert.equal(previous.instances[0].depth,0);assert.equal(current.corner,0);
 let prior=2;for(const t of current.instances){assert.ok(t.replace);assert.deepEqual(t.rounded,t.panelClip);assert.ok(t.reveal<=prior);prior=t.reveal;near(t.lower[0].x-t.upper[0].x,current.textureWidth);near(t.upper[1].y-t.upper[0].y,current.textureHeight);const shift=vertical?t.upper[0].y-(r.cy-r.height/2):t.upper[0].x-(r.cx-r.width/2);near(shift,(t.strip%2===0?-1:1)*(1-t.reveal)*(vertical?r.height:r.width));}
 assert.ok(current.instances.length>0&&current.instances.length<=strips);
 // Staggered, alternating entries split the source without scaling it into a strip.
 const duration=1/(strips-(strips-1)*.65),delay=duration*.35;
 for(let strip=0;strip<strips;strip++)for(const along of [.2,.5,.8]){
  let t=Math.max(0,Math.min(1,(.5-strip*delay)/duration));t=t<.5?4*t*t*t:1-(-2*t+2)**3/2;
  const u=(strip+.5)/strips,x=r.cx-r.width/2+(vertical?u:along)*r.width,y=r.cy-r.height/2+(vertical?along:u)*r.height,arrived=strip%2===0?along<t:along>1-t;
  assert.equal(topAt(a,x,y),arrived?0:2);
 }
 const complete=pose(.5/3,{frameRatio,strips},3,w,h)[0];assert.equal(complete.instances.length,1);assert.equal(complete.instances[0].strip,-1);assert.equal(complete.instances[0].replace,false);
}
for(const frameRatio of ['auto','1:1','16:9','9:16'])for(const strips of [3,14])for(const padding of [0,20])for(const cornerRadius of [0,12])for(const [w,h] of [[1280,720],[390,844]]){
 const cfg={frameRatio,strips,padding,cornerRadius},a=pose(0,cfg,8,w,h),seen=new Set();
 for(let sample=0;sample<48;sample++)for(const c of pose(sample/48,cfg,8,w,h)){
  assert.deepEqual([c.textureWidth,c.textureHeight,c.corner],[a[c.slot].textureWidth,a[c.slot].textureHeight,0]);assert.equal(c.visible,c.instances.length>0);assert.equal(c.alpha,c.visible?1:0);assert.ok(c.width>0&&c.width<=w+1e-6&&c.height>0&&c.height<=h+1e-6);
  for(const t of c.instances){seen.add(c.slot);assert.deepEqual(t.rounded,t.panelClip);assert.ok(t.rounded.radius<=Math.min(t.rounded.width,t.rounded.height)/2);for(const p of t.polygon)assert.ok(p.x>=c.clip.left-1e-6&&p.x<=c.clip.left+c.clip.width+1e-6&&p.y>=c.clip.top-1e-6&&p.y<=c.clip.top+c.clip.height+1e-6);near(t.lower[0].x-t.upper[0].x,c.textureWidth);near(t.upper[1].y-t.upper[0].y,c.textureHeight);}
 }
 assert.equal(seen.size,8);
}
for(const offsetX of [-50,50])for(const offsetY of [-50,50])for(const c of pose(.08,{frameRatio:'auto',offsetX,offsetY},8,390,844))assert.ok(c.width>0&&c.height>0&&c.upper.concat(c.lower).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
const a=pose(.08),scaled=pose(.08,{},3,2560,1440),offset=pose(.08,{offsetX:4,offsetY:-3});for(let i=0;i<3;i++){near(scaled[i].textureWidth,a[i].textureWidth*2);near(scaled[i].textureHeight,a[i].textureHeight*2);near(offset[i].upper[0].x-a[i].upper[0].x,28.8);near(offset[i].upper[0].y-a[i].upper[0].y,-21.6);}
const scroll={...defaults,turns:3,start:20,end:80};assert.deepEqual(plain(model.layout(1280,720,scroll,.1,3,1,true)),plain(model.layout(1280,720,scroll,.9,3,1,true)));
const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,8,1,true)),plain(model.layout(390,844,scroll,.317,8,1,true)));
console.log('Stripe Reveal: defaults/bounds, 3–14 strips, alternating full-source translations/stagger, adaptive orientation, 2–8 sources/order/holds/loop, transparent replacement, static rounded masks, stable textures, clipped extremes, scale/offsets, scroll/exported factory OK');
