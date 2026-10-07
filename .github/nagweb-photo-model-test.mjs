import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),defaults=model.config({kind:'photo-orbit'}),pose=(p,c={},n=8,w=1280,h=720)=>plain(model.layout(w,h,{...defaults,...c},p,n));
assert.equal(defaults.motion,'linear');assert.equal(defaults.direction,'right');assert.equal(defaults.cardRatio,'1:1');assert.equal(defaults.cardSize,26);assert.equal(defaults.ringWidth,56);assert.equal(defaults.ringHeight,56);assert.equal(defaults.pulse,60);
for(const [key,s] of Object.entries(model.photoSpecs)){assert.equal(model.config({kind:'photo-orbit',[key]:999})[key],s[2]);assert.equal(model.config({kind:'photo-orbit',[key]:-999})[key],s[1]);}
assert.equal(model.config({kind:'photo-orbit',motion:'other'}).motion,'linear');assert.equal(model.config({kind:'photo-orbit',direction:'other'}).direction,'right');
for(const n of [3,8,12])for(const motion of ['linear','pulse','steps'])for(const cardRatio of ['auto','1:1','9:16','16:9'])for(const [w,h] of [[1280,720],[390,844]]){
 const cfg={motion,cardRatio,frameRatio:'auto'},start=pose(0,cfg,n,w,h);assert.deepEqual(start,pose(1,cfg,n,w,h));
 for(let sample=0;sample<24;sample++)for(const card of pose(sample/24,cfg,n,w,h)){
  assert.equal(card.slot,card.depth);assert.equal(card.alpha,1);assert.equal(card.visible,true);assert.ok(card.width>0&&card.height>0&&card.width<=w+1e-7&&card.height<=h+1e-7);assert.ok(card.left>=card.clip.left-1e-7&&card.top>=card.clip.top-1e-7&&card.left+card.width<=card.clip.left+card.clip.width+1e-7&&card.top+card.height<=card.clip.top+card.clip.height+1e-7);assert.deepEqual([card.textureWidth,card.textureHeight,card.corner],[start[card.slot].textureWidth,start[card.slot].textureHeight,start[card.slot].corner]);
  assert.equal(card.upper[0].y,card.upper[1].y);assert.equal(card.lower[0].y,card.lower[1].y);assert.equal(card.upper[0].x,card.lower[0].x);assert.equal(card.upper[1].x,card.lower[1].x);assert.ok(card.upper.concat(card.lower).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));assert.ok(card.corner>=0&&card.corner<=Math.min(card.rect.width,card.rect.height)/2);
 }
 const a=pose(.317,cfg,n,w,h),b=pose(.317,cfg,n,w*2,h*2);for(let i=0;i<n;i++)for(const key of ['left','top','width','height','textureWidth','textureHeight','corner'])assert.ok(Math.abs(b[i][key]-a[i][key]*2)<1e-6);
}
// Every source keeps a different natural size while all cards remain upright.
assert.ok(new Set(pose(0).map(c=>c.textureWidth)).size>5);assert.equal(pose(0,{},1).length,3);assert.equal(pose(0,{},999).length,12);
for(let i=0;i<8;i++){assert.deepEqual(pose((i+.75)/8,{motion:'steps'}),pose((i+.9)/8,{motion:'steps'}));const stop=pose((i+.8)/8,{motion:'steps'})[0];assert.ok(Math.abs(stop.angle-(i+1)/8*2*Math.PI)<1e-8);}assert.notDeepEqual(pose(.1/8,{motion:'steps'}),pose(.4/8,{motion:'steps'}));
const center=c=>({x:c.rect.left+c.rect.width/2,y:c.rect.top+c.rect.height/2});for(const p of [.1,.317,.7]){const a=center(pose(p)[0]),b=center(pose(p,{direction:'left'})[0]);assert.ok(Math.abs(a.x+b.x-1280)<1e-7);assert.ok(Math.abs(a.y-b.y)<1e-7);}
const angle=p=>pose(p,{motion:'pulse',pulse:90})[0].angle;assert.ok(angle(.01)-angle(0)>angle(.51)-angle(.5));for(let i=1;i<64;i++)assert.ok(angle(i/64)>angle((i-1)/64));
assert.notDeepEqual(pose(.25,{motion:'pulse',pulse:10}),pose(.25,{motion:'pulse',pulse:90}));
for(const n of [3,12])for(const ringWidth of [30,80])for(const ringHeight of [30,80])for(const cardSize of [14,38])for(const cardRatio of ['9:16','16:9'])for(const padding of [0,20]){const cards=pose(.317,{ringWidth,ringHeight,cardSize,cardRatio,padding},n);assert.ok(cards.every(c=>c.visible&&c.width<=c.clip.width+1e-7&&c.height<=c.clip.height+1e-7));}
const scroll={...defaults,motion:'steps',direction:'left',turns:3,start:20,end:80};assert.deepEqual(plain(model.layout(1280,720,scroll,.1,12,1,true)),plain(model.layout(1280,720,scroll,.9,12,1,true)));
const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,12,1,true)),plain(model.layout(390,844,scroll,.317,12,1,true)));
console.log('Photo Orbit: defaults/bounds, 3–12 sources, upright cards/natural variation, both directions/three rhythms, stepped holds/pulse strength, frame extremes/ratios/scale, source-order depth, stable textures/bounded canvases, loop/scroll and exported factory OK');
