import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),defaults=model.config({kind:'diagonal-wipe'}),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`),pose=(p,c={},n=3,w=1280,h=720)=>plain(model.layout(w,h,{...defaults,...c},p,n,1));
for(const [key,s] of Object.entries(model.wipeSpecs)){assert.equal(defaults[key],s[0]);assert.equal(model.config({kind:'diagonal-wipe',[key]:999})[key],s[2]);assert.equal(model.config({kind:'diagonal-wipe',[key]:-999})[key],s[1]);}
assert.equal(defaults.kind,'diagonal-wipe');assert.equal(defaults.cardRatio,'frame');assert.equal(model.config({kind:'diagonal-wipe',cardRatio:'auto'}).cardRatio,'frame');
for(const [input,expected] of [[0,3],[1,2],[3,3],[99,8]])assert.equal(model.layout(1280,720,defaults,.275,input,.25).length,expected);
function inside(poly,x,y){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
function topAt(cards,x,y){return cards.filter(c=>c.instances.some(t=>inside(t.polygon,x,y))).sort((a,b)=>b.depth-a.depth)[0]?.slot;}
const mid=pose(.825/3),base=mid[0].instances[0],incoming=mid[1].instances[0];near(incoming.edge.threshold,0);near(incoming.edge.alpha,.3);near(incoming.edge.angle,-20*Math.PI/180);assert.ok(incoming.replace);assert.equal(base.replace,false);assert.deepEqual(base.rounded,incoming.rounded);assert.deepEqual(base.upper,incoming.upper);assert.equal(mid[0].corner,0);assert.equal(topAt(mid,350,360),0);assert.equal(topAt(mid,930,360),1);
for(const angle of [-45,0,45]){const cards=pose(.825/3,{angle}),t=cards[1].instances[0],r=t.rounded;near(t.edge.threshold,0);for(const x of [-.3,.3])for(const y of [-.3,.3]){const px=r.cx+x*r.width,py=r.cy+y*r.height,d=(px-r.cx)*Math.cos(angle*Math.PI/180)+(py-r.cy)*Math.sin(angle*Math.PI/180);if(Math.abs(d)<1e-6)continue;assert.equal(topAt(cards,px,py),d>=0?1:0);}}
for(const edgeGlow of [0,60,100]){const c=pose(.825/3,{edgeGlow});near(c[1].instances[0].edge.alpha,.5*edgeGlow/100);assert.deepEqual(c[1].upper,mid[1].upper);assert.deepEqual(c[1].instances[0].polygon,mid[1].instances[0].polygon);}
for(const n of [2,3,8]){
 for(let slot=0;slot<n;slot++){for(const local of [0,.3,.65]){const c=pose((slot+local)/n,{},n);assert.equal(c.filter(c=>c.visible).length,1);assert.equal(c.find(c=>c.visible).slot,slot);}const c=pose((slot+.825)/n,{},n);assert.equal(c.find(c=>c.incoming).slot,(slot+1)%n);assert.equal(c.find(c=>c.active).slot,slot);}
 assert.deepEqual(pose(0,{},n),pose(1,{},n));
 for(let boundary=1;boundary<=n;boundary++){const before=pose(boundary/n-1e-7,{},n),after=pose(boundary/n,{},n);for(const [x,y] of [[50,50],[640,360],[1220,650]])assert.equal(topAt(before,x,y),topAt(after,x,y));}
}
for(const frameRatio of ['auto','1:1','16:9','9:16'])for(const angle of [-45,0,45])for(const edgeGlow of [0,100])for(const padding of [0,6,20])for(const cornerRadius of [0,12])for(const [w,h] of [[1280,720],[390,844]]){
 const cfg={frameRatio,angle,edgeGlow,padding,cornerRadius},a=pose(0,cfg,8,w,h),seen=new Set();
 for(let sample=0;sample<64;sample++)for(const c of pose(sample/64,cfg,8,w,h)){
  assert.deepEqual([c.textureWidth,c.textureHeight,c.corner],[a[c.slot].textureWidth,a[c.slot].textureHeight,0]);assert.equal(c.visible,c.instances.length===1);assert.equal(c.alpha,c.visible?1:0);assert.ok(c.width>0&&c.width<=w+1e-6&&c.height>0&&c.height<=h+1e-6);assert.ok(c.upper.concat(c.lower).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  for(const t of c.instances){seen.add(c.slot);assert.deepEqual(t.rounded,t.panelClip);assert.ok(t.rounded.radius<=Math.min(t.rounded.width,t.rounded.height)/2);for(const p of t.polygon){assert.ok(p.x>=c.clip.left-1e-6&&p.x<=c.clip.left+c.clip.width+1e-6&&p.y>=c.clip.top-1e-6&&p.y<=c.clip.top+c.clip.height+1e-6);if(c.incoming)assert.ok((p.x-t.edge.cx)*t.edge.nx+(p.y-t.edge.cy)*t.edge.ny>=t.edge.threshold-1e-6);}if(c.incoming)assert.ok(t.edge.alpha>=0&&t.edge.alpha<=.5);}
 }
 assert.equal(seen.size,8);
}
const scaled=pose(.825/3,{},3,2560,1440),offset=pose(.825/3,{offsetX:4,offsetY:-3});for(let i=0;i<3;i++){near(scaled[i].textureWidth,mid[i].textureWidth*2);near(scaled[i].textureHeight,mid[i].textureHeight*2);near(scaled[i].upper[0].x,mid[i].upper[0].x*2);near(scaled[i].upper[0].y,mid[i].upper[0].y*2);near(offset[i].upper[0].x-mid[i].upper[0].x,28.8);near(offset[i].upper[0].y-mid[i].upper[0].y,-21.6);}
for(const offsetX of [-50,50])for(const offsetY of [-50,50])for(const angle of [-45,45])for(const c of pose(.825/3,{frameRatio:'auto',offsetX,offsetY,angle},8,390,844))assert.ok(c.width>0&&c.height>0&&c.upper.concat(c.lower).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
const scroll={...defaults,turns:3,start:20,end:80};assert.deepEqual(plain(model.layout(1280,720,scroll,.1,3,1,true)),plain(model.layout(1280,720,scroll,.9,3,1,true)));
const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,8,1,true)),plain(model.layout(390,844,scroll,.317,8,1,true)));
console.log('Diagonal Wipe: defaults/bounds, 2–8 sources, 65% hold/35% sweep, independent angular half-plane, source order/loop, static rounded frame/undistorted crop, edge glow without geometry changes, stable textures, clipped extremes, scale/offsets, scroll and exported factory OK');
