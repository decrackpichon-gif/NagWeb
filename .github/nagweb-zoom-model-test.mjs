import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),defaults=model.config({kind:'zoom-parallax'});
assert.equal(defaults.zoomAmount,12);assert.equal(defaults.panDir,'alternate');
assert.equal(model.config({kind:'zoom-parallax',zoomAmount:999,panDir:'invalid'}).zoomAmount,25);assert.equal(model.config({kind:'zoom-parallax',zoomAmount:-1}).zoomAmount,4);assert.equal(model.config({kind:'zoom-parallax',panDir:'invalid'}).panDir,'alternate');
for(const count of [2,3,5,8])for(const panDir of ['left','right','alternate'])for(const zoomAmount of [4,12,25])for(const [width,height] of [[1280,720],[390,844]]){
 const cfg={kind:'zoom-parallax',panDir,zoomAmount,frameRatio:'auto'},pose=p=>plain(model.layout(width,height,cfg,p,count)),start=pose(0);
 assert.equal(start.length,count);assert.deepEqual(start,pose(1));const seen=new Set();
 for(let sample=0;sample<120;sample++){
  const cards=pose(sample/120),visible=cards.filter(n=>n.alpha>0);assert.ok(visible.length>=1&&visible.length<=2);assert.ok(visible.some(n=>n.alpha===1),'An opaque base remains beneath each crossfade');
  for(const n of cards){if(n.alpha===1)seen.add(n.slot);assert.ok(n.zoom>=1&&n.zoom<=1+zoomAmount/100&&n.alpha>=0&&n.alpha<=1);const stable=start.find(o=>o.slot===n.slot);for(const key of ['left','top','width','height','textureWidth','textureHeight','clip','upper','lower'])assert.deepEqual(n[key],stable[key]);}
 }
 assert.equal(seen.size,count);
 for(let i=0;i<count;i++){
  const mid=pose((i+.5)/count).find(n=>n.slot===i),late=pose((i+.8)/count).find(n=>n.slot===i);assert.ok(late.zoom>mid.zoom);const direction=panDir==='left'?-1:panDir==='right'?1:i%2===0?-1:1;assert.ok((late.panX-mid.panX)*direction>0);
  const next=(i+1)%count,before=pose((i+1-1e-8)/count).find(n=>n.slot===next),after=pose((i+1+1e-8)/count).find(n=>n.slot===next);assert.ok(before.alpha>.999);assert.equal(after.alpha,1);assert.ok(Math.abs(before.zoom-after.zoom)<1e-7&&Math.abs(before.panX-after.panX)<1e-7,'Incoming drift is continuous at every handoff, including the last image');
  assert.ok(pose((i+.95)/count).find(n=>n.slot===next).alpha>pose((i+.85)/count).find(n=>n.slot===next).alpha);
 }
 const a=pose(.31),b=plain(model.layout(width*2,height*2,cfg,.31,count));a.forEach((n,i)=>{for(const side of ['upper','lower'])n[side].forEach((p,j)=>{for(const key of ['x','y'])assert.ok(Math.abs(b[i][side][j][key]-2*p[key])<1e-7);});});
}
for(const [iw,ih] of [[4096,1024],[800,1600],[300,300]])for(const zoom of [1,1.04,1.25])for(const pan of [-.5,0,.5])for(const focus of [{x:0,y:0},{x:50,y:50},{x:100,y:100}]){
 const crop=model.imageZoomCrop(iw,ih,640,360,zoom,pan,focus);assert.ok(crop.x<=0&&crop.y<=0&&crop.x+crop.width>=640-1e-7&&crop.y+crop.height>=360-1e-7,'Zoom never uncovers frame edges');assert.ok(Math.abs(crop.width/crop.height-iw/ih)<1e-7);
}
assert.equal(model.layout(1280,720,defaults,0,1).length,2);assert.equal(model.layout(1280,720,defaults,0,999).length,8);
const scroll={...defaults,turns:3,start:20,end:80};assert.equal(model.phase(.5,scroll,true),1.5);assert.deepEqual(plain(model.layout(1280,720,scroll,.1,3,1,true)),plain(model.layout(1280,720,scroll,.9,3,1,true)));
const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,3,1,true)),plain(model.layout(390,844,scroll,.317,3,1,true)));assert.deepEqual(plain(exported.imageZoomCrop(4096,1024,640,360,1.12,.25,{x:30})),plain(model.imageZoomCrop(4096,1024,640,360,1.12,.25,{x:30})));
console.log('Zoom Parallax: 2–8 images, zoom 4–25%, drift directions, opaque crossfades, seamless handoffs/loop, stable geometry, aspect/focus/edge coverage, responsive scale, scroll and exported factory OK');
