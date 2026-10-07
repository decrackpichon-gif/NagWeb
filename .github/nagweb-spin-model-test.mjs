import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const m=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),cfg=m.config({kind:'wheel-spin'}),pose=(p,c={},n=8,w=1280,h=720)=>plain(m.layout(w,h,{...cfg,...c},p,n));
for(const [k,v] of Object.entries({cardSize:26,wheelSize:92,rotations:1,spinRate:2,cornerRadius:5,anticipation:20,overshoot:10,hold:33,direction:'right',movement:'continuous',spinStyle:'none',flipAxis:'y',cardRatio:'1:1'}))assert.equal(cfg[k],v);
for(const [k,v] of Object.entries(m.spinSpecs)){assert.equal(m.config({kind:'wheel-spin',[k]:-999})[k],v[1]);assert.equal(m.config({kind:'wheel-spin',[k]:999})[k],v[2]);}
assert.equal(m.config({kind:'wheel-spin',rotations:2.7,spinRate:4.7}).rotations,3);assert.equal(m.config({kind:'wheel-spin',spinRate:4.7}).spinRate,5);
for(const n of [4,8,14])for(const direction of ['right','left'])for(const movement of ['continuous','stepped'])for(const rotations of [1,4])for(const spinStyle of ['none','self','flip'])for(const flipAxis of ['x','y']){
 const c={direction,movement,rotations,spinStyle,flipAxis},start=pose(0,c,n);assert.deepEqual(start,pose(1,c,n));
 for(const progress of [0,.037,.187,.317,.499,.777,.999999])for(const card of pose(progress,c,n)){
  assert.deepEqual([card.textureWidth,card.textureHeight,card.corner],[start[card.slot].textureWidth,start[card.slot].textureHeight,start[card.slot].corner]);assert.ok(card.left>=card.clip.left-1e-7&&card.top>=card.clip.top-1e-7&&card.left+card.width<=card.clip.left+card.clip.width+1e-7&&card.top+card.height<=card.clip.top+card.clip.height+1e-7);assert.ok(card.instances.length<=1);
  for(const t of card.instances){assert.ok(t.polygon.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));assert.equal(t.stripDepth[0],t.depth);assert.equal(t.rounded.radius,card.corner);const edge=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);assert.ok(Math.abs(edge(t.upper[0],t.upper[1])-card.textureWidth*Math.abs(t.rounded.scaleX))<1e-6);assert.ok(Math.abs(edge(t.upper[0],t.lower[0])-card.textureHeight*Math.abs(t.rounded.scaleY))<1e-6);}
 }
 if(movement==='stepped'&&spinStyle==='none')for(let i=0;i<n*rotations;i++)assert.deepEqual(pose((i+.85)/(n*rotations),c,n),pose((i+.95)/(n*rotations),c,n));
 const end=pose(1-1e-8,c,n);for(let i=0;i<n;i++){assert.equal(start[i].instances.length,end[i].instances.length);for(let k=0;k<start[i].instances.length;k++)for(let j=0;j<4;j++){const a=start[i].instances[k].polygon[j],b=end[i].instances[k].polygon[j];assert.ok(Math.abs(a.x-b.x)<.001&&Math.abs(a.y-b.y)<.001);}}
}
// A complete wheel fits at default offset, even for the widest ratio and full card self-rotation.
for(const cardRatio of ['auto','1:1','4:3','3:4','4:5','16:9','9:16'])for(const [w,h] of [[1280,720],[390,844]])for(const cardSize of [12,26,45])for(const wheelSize of [50,100]){
 const c={cardRatio,frameRatio:'auto',cardSize,wheelSize,spinStyle:'self'},cards=pose(.317,c,14,w,h),scaled=pose(.317,c,14,w*2,h*2);for(let i=0;i<cards.length;i++){
  for(const t of cards[i].instances)for(const p of t.polygon){assert.ok(p.x>=cards[i].clip.left-1e-7&&p.x<=cards[i].clip.left+cards[i].clip.width+1e-7&&p.y>=cards[i].clip.top-1e-7&&p.y<=cards[i].clip.top+cards[i].clip.height+1e-7||Math.hypot(cards[i].textureWidth,cards[i].textureHeight)>Math.min(cards[i].clip.width,cards[i].clip.height),'Wheel radius reserves the rotating card diagonal');}
  assert.equal(cards[i].instances.length,scaled[i].instances.length);for(let k=0;k<cards[i].instances.length;k++)for(let j=0;j<4;j++){const a=cards[i].instances[k].polygon[j],b=scaled[i].instances[k].polygon[j];assert.ok(Math.abs(b.x-a.x*2)<1e-6&&Math.abs(b.y-a.y*2)<1e-6);}
 }
}
const edge=pose(1/8,{spinStyle:'flip',spinRate:2});assert.equal(edge[0].instances.length,0,'Edge-on cards disappear without a singular inverse transform');assert.ok(edge.some(c=>c.instances.length));assert.ok(pose(.317,{spinStyle:'flip'}).some(c=>c.instances[0]?.rounded.scaleX<0),'Back faces mirror the same source');assert.equal(pose(0,{},1).length,4);assert.equal(pose(0,{},99).length,14);
for(const offsetX of [-50,50])for(const offsetY of [-50,50])assert.ok(pose(.317,{offsetX,offsetY}).every(c=>c.width<=c.clip.width+1e-7&&c.height<=c.clip.height+1e-7));
assert.ok(pose(.05/8,{movement:'stepped'})[0].instances[0].angle<0,'Anticipation reverses before advancing');const scroll={...cfg,turns:3,start:20,end:80};assert.deepEqual(plain(m.layout(1280,720,scroll,.1,8,1,true)),plain(m.layout(1280,720,scroll,.9,8,1,true)));const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,14,1,true)),plain(m.layout(390,844,scroll,.317,14,1,true)));
console.log('Wheel Spin: defaults/bounds, 4–14 sources, directions/1–4 rotations, continuous/stepped holds, self-rotation, both flip axes/mirrored backs/edge-on culling, reserved wheel radius, all ratios/scale/offsets, stable textures/bounded canvas, loop continuity, scroll and exported factory OK');
