import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),defaults=model.config({kind:'spiral-stream'}),pose=(p,c={},n=12,w=1280,h=720)=>plain(model.layout(w,h,{...defaults,...c},p,n));
assert.equal(defaults.spiralTurns,3.75);assert.equal(defaults.turns,1);assert.equal(defaults.cardCount,24);assert.equal(defaults.cardSize,33);assert.equal(defaults.cardStyle,'curved');assert.equal(defaults.motion,'flow');assert.equal(defaults.cardRatio,'1:1');
for(const [key,spec] of Object.entries(model.spiralSpecs)){assert.equal(model.config({kind:'spiral-stream',[key]:9999})[key],spec[2]);assert.equal(model.config({kind:'spiral-stream',[key]:-9999})[key],spec[1]);}
assert.equal(model.config({kind:'spiral-stream',cardCount:12.7}).cardCount,13);assert.equal(model.config({kind:'spiral-stream',motion:'invalid',direction:'invalid',cardStyle:'invalid'}).motion,'flow');
for(const n of [6,12,20])for(const cardCount of [8,24,48])for(const cardStyle of ['curved','upright'])for(const frameRatio of ['auto','16:9','9:16']){
 const cfg={cardCount,cardStyle,frameRatio},start=pose(0,cfg,n),seen=new Set();assert.deepEqual(start,pose(1,cfg,n),'Full movement closes even when source count does not divide card count');
 for(let sample=0;sample<32;sample++)for(const card of pose(sample/32,cfg,n)){
  assert.ok(card.width>0&&card.width<=1280&&card.height>0&&card.height<=720);assert.ok(card.left>=card.clip.left&&card.top>=card.clip.top);assert.ok(card.left+card.width<=card.clip.left+card.clip.width+1e-7&&card.top+card.height<=card.clip.top+card.clip.height+1e-7);assert.deepEqual([card.textureWidth,card.textureHeight,card.corner],[start[card.slot].textureWidth,start[card.slot].textureHeight,start[card.slot].corner]);
  for(const t of card.instances){seen.add(t.index);assert.equal(card.slot,t.index%n);assert.ok(t.alpha>=.05&&t.alpha<=1);assert.equal(t.stripDepth.length,t.upper.length-1);assert.equal(t.upper.length,t.lower.length);assert.ok(t.polygon.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));assert.equal(t.upper.length,cardStyle==='upright'?2:49);}
 }
 assert.equal(seen.size,cardCount,'Every physical card crosses the visible frame during a cycle');
}
for(const tilt of [-45,0,45])for(const taper of [-90,0,90])for(const perspective of [0,40])for(const cardRatio of ['auto','9:16','16:9'])for(const cardStyle of ['curved','upright']){
 const cfg={tilt,taper,perspective,cardRatio,cardStyle,scalePulse:60,ringSize:35,spiralTurns:6,cardCount:48,padding:20,frameRatio:'auto'};
 for(const [w,h] of [[1280,720],[390,844]])for(const p of [0,.21,.99]){const cards=pose(p,cfg,20,w,h);assert.ok(cards.some(c=>c.visible));assert.ok(cards.every(c=>c.width<=w+1e-7&&c.height<=h+1e-7));}
 const a=pose(.317,cfg),b=pose(.317,cfg,12,2560,1440);for(let i=0;i<a.length;i++)for(let k=0;k<a[i].instances.length;k++)for(const [j,p] of a[i].instances[k].polygon.entries()){assert.ok(Math.abs(b[i].instances[k].polygon[j].x-p.x*2)<1e-6);assert.ok(Math.abs(b[i].instances[k].polygon[j].y-p.y*2)<1e-6);}
}
assert.deepEqual(pose(.23,{direction:'up'}),pose(.77,{direction:'down'}));assert.notDeepEqual(pose(.13,{motion:'pulse'}),pose(.13));assert.deepEqual(pose(.7/24,{motion:'steps'}),pose(.9/24,{motion:'steps'}),'Each card holds after the first 55% of its step');assert.notDeepEqual(pose(.1/24,{motion:'steps'}),pose(.3/24,{motion:'steps'}));
const near=pose(1e-8),far=pose(1-1e-8);for(const c of near)for(const t of c.instances){const other=far[c.slot].instances.find(n=>n.index===t.index);assert.ok(other,'Wrapping card is offscreen');assert.ok(Math.abs(t.upper[0].x-other.upper[0].x)<.001&&Math.abs(t.upper[0].y-other.upper[0].y)<.001);}
const scroll={...defaults,turns:3,start:20,end:80};assert.equal(model.phase(.5,scroll,true),1.5);assert.deepEqual(plain(model.layout(1280,720,scroll,.1,12,1,true)),plain(model.layout(1280,720,scroll,.9,12,1,true)));const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,20,1,true)),plain(model.layout(390,844,scroll,.317,20,1,true)));
console.log('Spiral Stream: all controls/defaults/bounds, 6–20 sources and 8–48 cards, curved/flat geometry, per-strip depth, taper/tilt/perspective extremes, stable textures/bounded canvases, all cards seen, smooth/step/pulse, loop/wrap continuity, responsive scaling, scroll and exported factory OK');
