import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),defaults=model.config({kind:'focus-shift'}),bySlot=cards=>cards.slice().sort((a,b)=>a.slot-b.slot);
assert.equal(defaults.railSize,26);assert.equal(defaults.gap,2.5);assert.equal(model.config({kind:'focus-shift',railSize:999,gap:999}).railSize,40);assert.equal(model.config({kind:'focus-shift',railSize:-1,gap:-1}).gap,.5);
for(const count of [3,4,6])for(const [width,height] of [[1280,720],[390,844]])for(const frameRatio of ['auto','16:9','9:16'])for(const railSize of [18,26,40]){
 const cfg={kind:'focus-shift',frameRatio,railSize},pose=p=>plain(model.layout(width,height,cfg,p,count)),start=pose(0),seen=new Set();assert.equal(start.length,count);assert.deepEqual(start,pose(1),'Loop closes with every image in its previous role');
 for(let sample=0;sample<96;sample++)for(const n of pose(sample/96)){
  assert.equal(n.alpha,1);assert.equal(n.visible,true);if(n.focus===1)seen.add(n.slot);assert.ok(n.focus>=0&&n.focus<=1);assert.ok(n.rect.width>0&&n.rect.height>0&&n.width<=width+7&&n.height<=height+7);for(const p of n.upper.concat(n.lower))assert.ok(p.x>=n.clip.left-1e-7&&p.x<=n.clip.left+n.clip.width+1e-7&&p.y>=n.clip.top-1e-7&&p.y<=n.clip.top+n.clip.height+1e-7);const first=start.find(o=>o.slot===n.slot);assert.deepEqual([n.textureWidth,n.textureHeight],[first.textureWidth,first.textureHeight]);
 }
 assert.equal(seen.size,count,'Each image occupies the spotlight once per cycle');
 for(let slot=0;slot<count;slot++){
  const hold=pose((slot+.75)/count),hero=hold.find(n=>n.focus===1),thumbs=hold.filter(n=>n.focus===0);assert.equal(hero.slot,slot);assert.equal(hero.depth,count+1);assert.deepEqual(hold,pose((slot+.9)/count),'Spotlight holds after expansion');assert.equal(thumbs.length,count-1);
  if(hero.rail==='right'){assert.ok(thumbs.every(n=>n.rect.left>=hero.rect.left+hero.rect.width));assert.ok(thumbs.every(n=>Math.abs(n.rect.width/hero.clip.width-railSize/100)<1e-7));}else{assert.ok(thumbs.every(n=>n.rect.top>=hero.rect.top+hero.rect.height));assert.ok(thumbs.every(n=>Math.abs(n.rect.height/hero.clip.height-railSize/100)<1e-7));}
  const before=bySlot(pose((slot+1-1e-8)/count)),after=bySlot(pose((slot+1+1e-8)/count));for(let i=0;i<count;i++){for(const key of ['left','top','width','height'])assert.ok(Math.abs(before[i].rect[key]-after[i].rect[key])<1e-5);assert.ok(Math.abs(before[i].corner-after[i].corner)<1e-5,'Corners remain continuous at handoff');}
 }
 const a=bySlot(pose(.317)),b=bySlot(plain(model.layout(width*2,height*2,cfg,.317,count)));for(let i=0;i<count;i++)for(const key of ['left','top','width','height'])assert.ok(Math.abs(b[i].rect[key]-a[i].rect[key]*2)<1e-7);
}
const landscape=plain(model.layout(1280,720,{...defaults,frameRatio:'auto'},.1875,4)),portrait=plain(model.layout(390,844,{...defaults,frameRatio:'auto'},.1875,4));assert.ok(landscape.every(n=>n.rail==='right'));assert.ok(portrait.every(n=>n.rail==='bottom'));
for(const [width,height] of [[1280,720],[390,844]])for(const count of [3,6])for(const padding of [0,20])for(const gap of [.5,8]){const cards=model.layout(width,height,{...defaults,frameRatio:'auto',padding,gap,railSize:40},.15,count);assert.ok(cards.every(n=>n.rect.width>0&&n.rect.height>0));}
assert.equal(model.layout(1280,720,defaults,0,1).length,3);assert.equal(model.layout(1280,720,defaults,0,999).length,6);const scroll={...defaults,turns:3,start:20,end:80};assert.equal(model.phase(.5,scroll,true),1.5);assert.deepEqual(plain(model.layout(1280,720,scroll,.1,4,1,true)),plain(model.layout(1280,720,scroll,.9,4,1,true)));const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,4,1,true)),plain(model.layout(390,844,scroll,.317,4,1,true)));
console.log('Focus Shift: 3–6 images, rotating spotlight/thumbnail rail, portrait/landscape, hold and continuous handoffs/corners, rail 18–40%, gap .5–8%, bounded geometry/stable source sizes, responsive scaling, scroll and exported factory OK');
