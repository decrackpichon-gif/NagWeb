import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),defaults=model.config({kind:'hero-reel'}),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`),pose=(p,c={},n=7,w=1280,h=720)=>plain(model.layout(w,h,{...defaults,...c},p,n,1)),thumbs=c=>c.map(c=>c.instances.find(t=>t.role==='thumbnail'));
for(const [key,s] of Object.entries(model.heroSpecs)){assert.equal(defaults[key],s[0]);assert.equal(model.config({kind:'hero-reel',[key]:999})[key],s[2]);assert.equal(model.config({kind:'hero-reel',[key]:-999})[key],s[1]);}
assert.equal(defaults.cardRatio,'1:1');assert.equal(model.config({kind:'hero-reel',cardRatio:'9:16'}).cardRatio,'1:1');
for(const [input,expected] of [[0,7],[1,3],[7,7],[99,10]])assert.equal(model.layout(1280,720,defaults,.08,input,.25).length,expected);
for(const [key,value] of [['style','grid'],['pattern','normal'],['orientation','horizontal'],['openFrom','start']])assert.equal(defaults[key],value);
const start=pose(0),tile=thumbs(start)[0],r=tile.rounded;near(start[0].raise,1);near(start[0].scale,1.08);assert.ok(start[0].thumbnail.top<start[1].thumbnail.top);for(const c of start){const thumb=c.instances.find(t=>t.role==='thumbnail');assert.ok(thumb);assert.equal(thumb.alpha,1);near(thumb.rounded.width,thumb.rounded.height);near(c.textureWidth,c.textureHeight);assert.equal(c.corner,0);}
for(const n of [3,7,10]){
 assert.deepEqual(pose(0,{},n),pose(1,{},n));
 for(let slot=0;slot<n;slot++){
  const a=pose(slot/n,{},n),b=pose((slot+.4)/n,{},n),c=pose((slot+.775)/n,{},n);assert.equal(a.reduce((best,t)=>t.raise>best.raise?t:best).slot,slot);
  for(let k=0;k<n;k++)assert.deepEqual(a[k].thumbnail,b[k].thumbnail);
  assert.ok(c.flatMap(c=>c.instances).some(t=>t.role==='backdrop'&&t.replace));assert.equal(c.filter(c=>c.instances.some(t=>t.role==='backdrop'&&t.replace))[0].slot,(slot+1)%n);
  const before=pose((slot+1)/n-1e-7,{},n),after=pose((slot+1)/n,{},n);for(let k=0;k<n;k++){near(before[k].thumbnail.left,after[k].thumbnail.left);near(before[k].thumbnail.top,after[k].thumbnail.top);near(before[k].thumbnail.width,after[k].thumbnail.width);}
 }
}
for(const p of [.1,.25,.6,.99]){const a=pose(p,{lift:0,activeScale:100});assert.ok(a.every(c=>Math.abs(c.thumbnail.top-a[0].thumbnail.top)<1e-6));assert.ok(a.every(c=>Math.abs(c.thumbnail.width-a[0].thumbnail.width)<1e-6));}
for(const opacity of [0,55,100]){const a=pose(.775/7,{heroOpacity:opacity});for(const c of a)assert.deepEqual(c.thumbnail,pose(.775/7)[c.slot].thumbnail);const bg=a.flatMap(c=>c.instances).filter(t=>t.role==='backdrop');if(opacity===0)assert.equal(bg.length,0);else assert.ok(bg.every(t=>t.alpha===opacity/100));}
for(const kenBurns of [0,100]){const a=pose(.1,{kenBurns}),b=pose(.2,{kenBurns}),bg=a.flatMap(c=>c.instances).find(t=>t.role==='backdrop');assert.ok(bg.zoom>=1.03&&bg.zoom<=1.09);if(kenBurns===0){assert.equal(bg.zoom,1.03);assert.equal(bg.panX,0);assert.equal(bg.panY,0);assert.equal(bg.zoom,b.flatMap(c=>c.instances).find(t=>t.role==='backdrop').zoom);}else assert.notEqual(bg.zoom,b.flatMap(c=>c.instances).find(t=>t.role==='backdrop').zoom);}
for(const hold of [20,55,80]){const a=pose((hold/100*.9)/7,{hold}),b=pose((hold/100+(1-hold/100)/2)/7,{hold});near(a[0].raise,1);assert.ok(b.flatMap(c=>c.instances).some(t=>t.role==='backdrop'&&t.replace));}
for(const style of ['grid','blinds'])for(const stagger of [0,100])for(const speedVariation of [0,100]){
 const cfg={style,stagger,speedVariation,rows:8,columns:8,slats:20},a=pose(.999999/7,cfg),incoming=a[1].instances.filter(t=>t.role==='backdrop');assert.ok(incoming.length);for(const t of incoming){assert.ok(t.replace);assert.ok(t.mosaicMask);near(t.upper[0].x,a[0].clip.left);near(t.upper[0].y,a[0].clip.top);}assert.ok(incoming.every(t=>t.imageFrame.width===a[0].clip.width&&t.imageFrame.height===a[0].clip.height));
}
for(const pattern of ['normal','diagonal','radial','spiral','random']){const a=pose(.775/7,{pattern});assert.deepEqual(a,pose(.775/7,{pattern}));if(pattern!=='normal')assert.notDeepEqual(a[1].instances.filter(t=>t.role==='backdrop'),pose(.775/7)[1].instances.filter(t=>t.role==='backdrop'));}
for(const style of ['grid','blinds'])for(const frameRatio of ['auto','16:9','9:16'])for(const [w,h] of [[1280,720],[390,844]])for(const n of [3,10]){
 const cfg={style,frameRatio,cornerRadius:12,gap:6,lift:4,activeScale:120,kenBurns:100,stagger:100,speedVariation:100},a=pose(0,cfg,n,w,h);
 for(let sample=0;sample<24;sample++)for(const c of pose(sample/24,cfg,n,w,h)){assert.deepEqual([c.textureWidth,c.textureHeight,c.corner],[a[c.slot].textureWidth,a[c.slot].textureHeight,0]);assert.equal(c.visible,c.instances.length>0);assert.ok(c.width>0&&c.width<=w+1e-6&&c.height>0&&c.height<=h+1e-6);for(const t of c.instances){assert.deepEqual(t.rounded,t.panelClip);assert.ok(t.rounded.radius<=Math.min(t.rounded.width,t.rounded.height)/2);for(const p of t.polygon)assert.ok(p.x>=c.clip.left-1e-6&&p.x<=c.clip.left+c.clip.width+1e-6&&p.y>=c.clip.top-1e-6&&p.y<=c.clip.top+c.clip.height+1e-6);if(t.role==='thumbnail')assert.ok(t.depth>=10&&t.zoom===1);else assert.ok(t.depth<0&&t.rounded.radius===0&&t.alpha===.55);}}
}
const a=pose(.08),scaled=pose(.08,{},7,2560,1440),offset=pose(.08,{offsetX:4,offsetY:-3});for(let i=0;i<7;i++){near(scaled[i].textureWidth,a[i].textureWidth*2);near(scaled[i].textureHeight,a[i].textureHeight*2);near(offset[i].thumbnail.left-a[i].thumbnail.left,28.8);near(offset[i].thumbnail.top-a[i].thumbnail.top,-21.6);}assert.deepEqual(offset[0].instances.find(t=>t.role==='backdrop').imageFrame,a[0].instances.find(t=>t.role==='backdrop').imageFrame);
const scroll={...defaults,turns:3,start:20,end:80};assert.deepEqual(plain(model.layout(1280,720,scroll,.1,7,1,true)),plain(model.layout(1280,720,scroll,.9,7,1,true)));
const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,10,1,true)),plain(model.layout(390,844,scroll,.317,10,1,true)));
console.log('Hero Reel: defaults/bounds, 3–10 linked thumbnails/backdrops, square full-source planes, circular lift/scale/hold/handoff, independent opacity/Ken Burns, deterministic grid/blinds masks, extreme timing completion, depth/shadows, stable textures/bounded geometry, scale/offsets, scroll/exported factory OK');
