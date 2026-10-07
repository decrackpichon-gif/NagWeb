import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const m=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),cfg=m.config({kind:'wheel-spin-bottom'}),pose=(p,c={},n=8,w=1280,h=720)=>plain(m.layout(w,h,{...cfg,...c},p,n));
for(const [k,v] of Object.entries({kind:'wheel-spin-bottom',cardSize:20,wheelSize:50,rotations:1,spinRate:2,cornerRadius:5,anticipation:20,overshoot:10,hold:33,stagger:40,direction:'right',movement:'continuous',spinStyle:'none',flipAxis:'y',cardRatio:'1:1'}))assert.equal(cfg[k],v);
for(const [k,v] of Object.entries(m.bottomSpecs)){assert.equal(m.config({kind:'wheel-spin-bottom',[k]:-999})[k],v[1]);assert.equal(m.config({kind:'wheel-spin-bottom',[k]:999})[k],v[2]);}
for(const n of [4,8,14])for(const direction of ['right','left'])for(const movement of ['continuous','stepped'])for(const rotations of [1,4])for(const spinStyle of ['none','self','flip'])for(const flipAxis of ['x','y']){
 const c={direction,movement,rotations,spinStyle,flipAxis},start=pose(0,c,n);assert.deepEqual(start,pose(1,c,n));const seen=new Set();
 for(let sample=0;sample<33;sample++)for(const card of pose(sample/33,c,n)){
  assert.deepEqual([card.textureWidth,card.textureHeight,card.corner],[start[card.slot].textureWidth,start[card.slot].textureHeight,start[card.slot].corner]);assert.ok(card.left>=card.clip.left-1e-7&&card.top>=card.clip.top-1e-7&&card.left+card.width<=card.clip.left+card.clip.width+1e-7&&card.top+card.height<=card.clip.top+card.clip.height+1e-7);assert.ok(card.instances.length<=2);
  for(const t of card.instances){seen.add(card.slot);assert.ok(t.polygon.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));assert.equal(t.stripDepth[0],t.depth);const r=t.rounded,edge=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);assert.equal(r.radius,card.corner);assert.ok(Math.abs(edge(t.upper[0],t.upper[1])-card.textureWidth*Math.abs(r.scaleX))<1e-6);assert.ok(Math.abs(edge(t.upper[0],t.lower[0])-card.textureHeight*Math.abs(r.scaleY))<1e-6);assert.ok(Math.abs(Math.hypot(r.cx-1280/2,r.cy-(720/2+720*cfg.wheelSize/100))-720*cfg.wheelSize/100)<1e-6);}
 }
 assert.equal(seen.size,n,'Every editable source enters the visible dome');
 if(movement==='stepped'&&spinStyle==='none')for(let i=0;i<n*2*rotations;i++)assert.deepEqual(pose((i+.97)/(n*2*rotations),c,n),pose((i+.99)/(n*2*rotations),c,n));
 const end=pose(1-1e-8,c,n);for(let i=0;i<n;i++){assert.equal(start[i].instances.length,end[i].instances.length);for(let k=0;k<start[i].instances.length;k++)for(let j=0;j<4;j++){const a=start[i].instances[k].polygon[j],b=end[i].instances[k].polygon[j];assert.ok(Math.abs(a.x-b.x)<.001&&Math.abs(a.y-b.y)<.001);}}
}
// Stagger is angular, capped by the available pause, and ignored for continuous motion.
assert.notDeepEqual(pose(.35/16,{movement:'stepped',stagger:0}),pose(.35/16,{movement:'stepped',stagger:100}));assert.deepEqual(pose(.35/16,{movement:'continuous',stagger:0}),pose(.35/16,{movement:'continuous',stagger:100}));assert.deepEqual(pose(.35/16,{movement:'stepped',hold:0,stagger:0}),pose(.35/16,{movement:'stepped',hold:0,stagger:100}));
for(const direction of ['right','left'])for(const hold of [0,33,60])for(const stagger of [0,40,100])for(let turn=1;turn<16;turn++){
 const a=pose((turn-1e-7)/16,{movement:'stepped',direction,hold,stagger}),b=pose(turn/16,{movement:'stepped',direction,hold,stagger});for(let i=0;i<8;i++){assert.equal(a[i].instances.length,b[i].instances.length);for(let k=0;k<a[i].instances.length;k++)for(let j=0;j<4;j++){assert.ok(Math.abs(a[i].instances[k].polygon[j].x-b[i].instances[k].polygon[j].x)<.001&&Math.abs(a[i].instances[k].polygon[j].y-b[i].instances[k].polygon[j].y)<.001);}}
}
for(const cardRatio of ['auto','1:1','4:3','3:4','4:5','16:9','9:16'])for(const [w,h] of [[1280,720],[390,844]])for(const wheelSize of [30,90])for(const cardSize of [10,36]){
 const c={cardRatio,frameRatio:'auto',wheelSize,cardSize,spinStyle:'self'},cards=pose(.317,c,14,w,h),scaled=pose(.317,c,14,w*2,h*2);for(let i=0;i<14;i++){assert.equal(cards[i].instances.length,scaled[i].instances.length);for(let k=0;k<cards[i].instances.length;k++)for(let j=0;j<4;j++){const a=cards[i].instances[k].polygon[j],b=scaled[i].instances[k].polygon[j];assert.ok(Math.abs(b.x-a.x*2)<1e-6&&Math.abs(b.y-a.y*2)<1e-6);}}
}
const copies=pose(0,{wheelSize:30,cardSize:36,cardRatio:'16:9'},4,390,844);assert.ok(copies.some(c=>c.instances.length===2),'Opposite copies share one source');const edge=pose(1/8,{spinStyle:'flip',spinRate:2});assert.equal(edge[0].instances.length,0);assert.ok(edge.some(c=>c.instances.length));assert.ok(pose(.25,{spinStyle:'flip'}).some(c=>c.instances.some(t=>t.rounded.scaleX<0)));assert.equal(pose(0,{},1).length,4);assert.equal(pose(0,{},99).length,14);
for(const offsetX of [-50,50])for(const offsetY of [-50,50])assert.ok(pose(.317,{offsetX,offsetY}).every(c=>c.width<=c.clip.width+1e-7&&c.height<=c.clip.height+1e-7));
const scroll={...cfg,turns:3,start:20,end:80};assert.deepEqual(plain(m.layout(1280,720,scroll,.1,8,1,true)),plain(m.layout(1280,720,scroll,.9,8,1,true)));const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,14,1,true)),plain(m.layout(390,844,scroll,.317,14,1,true)));
console.log('Wheel Spin Bottom: defaults/bounds, 4–14 sources/linked copies, directions/1–4 rotations, continuous/stepped holds, angular stagger/capped delay and seamless handoffs, self-rotation/flip axes/mirrored backs/edge-on culling, dome radius, ratios/scale/offsets, stable textures/bounded canvas, loop, scroll and exported factory OK');
