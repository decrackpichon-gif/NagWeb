import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),defaults=model.config({kind:'mosaic-wipe'}),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`),pose=(p,c={},n=4,w=1280,h=720)=>plain(model.layout(w,h,{...defaults,...c},p,n,1));
for(const [key,s] of Object.entries(model.mosaicSpecs)){assert.equal(defaults[key],s[0]);assert.equal(model.config({kind:'mosaic-wipe',[key]:999})[key],s[2]);assert.equal(model.config({kind:'mosaic-wipe',[key]:-999})[key],s[1]);}
assert.equal(defaults.cardRatio,'frame');assert.equal(model.config({kind:'mosaic-wipe',cardRatio:'auto'}).cardRatio,'frame');
for(const key of ['rows','columns','slats'])assert.equal(model.config({kind:'mosaic-wipe',[key]:4.7})[key],5);
for(const [key,value] of [['style','grid'],['pattern','normal'],['orientation','horizontal'],['openFrom','start']]){assert.equal(defaults[key],value);assert.equal(model.config({kind:'mosaic-wipe',[key]:'invalid'})[key],value);}
for(const [input,expected] of [[0,4],[1,2],[4,4],[99,8]])assert.equal(model.layout(1280,720,defaults,.08,input,.25).length,expected);
assert.deepEqual(plain(model.mosaicOrder(2,3,'normal')),[0,1,2,3,4,5]);assert.deepEqual(plain(model.mosaicOrder(2,3,'diagonal')),[0,1,2,1,2,3]);assert.deepEqual(plain(model.mosaicOrder(3,3,'spiral')),[0,1,2,7,8,3,6,5,4]);const radial=plain(model.mosaicOrder(3,3,'radial'));near(radial[4],0);near(radial[0],Math.sqrt(2));near(radial[1],1);
for(const [rows,columns] of [[1,1],[1,8],[8,1],[8,8]])for(const pattern of ['normal','diagonal','radial','spiral','random']){const ranks=plain(model.mosaicOrder(rows,columns,pattern));assert.equal(ranks.length,rows*columns);assert.ok(ranks.every(Number.isFinite));if(['normal','spiral','random'].includes(pattern))assert.deepEqual(ranks.slice().sort((a,b)=>a-b),Array.from({length:rows*columns},(_,i)=>i));if(pattern==='random'){assert.deepEqual(ranks,plain(model.mosaicOrder(rows,columns,pattern)));if(rows*columns>1)assert.notDeepEqual(ranks,plain(model.mosaicOrder(rows,columns,'normal')));}}
function inside(poly,x,y){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
function topAt(cards,x,y){return cards.flatMap(c=>c.instances.map(t=>({...t,slot:c.slot}))).filter(t=>inside(t.polygon,x,y)).sort((a,b)=>b.depth-a.depth)[0]?.slot;}
// No stagger: grid tiles open around fixed centers without moving the source image.
const mid=pose(.3/4,{rows:2,columns:2,stagger:0}),r=mid[3].instances[0].rounded;
for(const row of [0,1])for(const col of [0,1]){const x=r.cx-r.width/2+(col+.5)*r.width/2,y=r.cy-r.height/2+(row+.5)*r.height/2;assert.equal(topAt(mid,x,y),0);assert.equal(topAt(mid,x+r.width/2*.35,y),3);const tile=mid[0].instances.find(t=>t.piece===row*2+col);near(tile.reveal,.5);assert.deepEqual(tile.upper,mid[3].upper);assert.ok(tile.replace&&tile.mosaicMask);}
for(const orientation of ['horizontal','vertical'])for(const openFrom of ['start','end','center','alternate']){
 const cards=pose(.3/4,{style:'blinds',slats:4,stagger:0,orientation,openFrom}),r=cards[3].instances[0].rounded;
 for(let slat=0;slat<4;slat++)for(const across of [.2,.8]){const from=openFrom==='alternate'?(slat%2?'end':'start'):openFrom,hit=from==='start'?across<.5:from==='end'?across>.5:across>.25&&across<.75,x=r.cx-r.width/2+(orientation==='vertical'?(slat+across)/4:.5)*r.width,y=r.cy-r.height/2+(orientation==='horizontal'?(slat+across)/4:.5)*r.height;assert.equal(topAt(cards,x,y),hit?0:3);}
}
for(const n of [2,4,8]){for(let slot=0;slot<n;slot++){assert.deepEqual(pose(slot/n,{},n).filter(c=>c.visible).map(c=>c.slot),[(slot+n-1)%n]);for(const local of [.6,.75,.99])assert.deepEqual(pose((slot+local)/n,{},n).filter(c=>c.visible).map(c=>c.slot),[slot]);}assert.deepEqual(pose(0,{},n),pose(1,{},n));}
const patterns=['normal','diagonal','radial','spiral','random'];for(const pattern of patterns){const a=pose(.12,{pattern});assert.deepEqual(a,pose(.12,{pattern}));if(pattern!=='normal')assert.notDeepEqual(a[0].instances,pose(.12,{pattern:'normal'})[0].instances);}
assert.notDeepEqual(pose(.1,{stagger:0})[0].instances,pose(.1,{stagger:100})[0].instances);assert.notDeepEqual(pose(.1,{stagger:0,speedVariation:0})[0].instances,pose(.1,{stagger:0,speedVariation:100})[0].instances);
for(const style of ['grid','blinds'])for(const stagger of [0,60,100])for(const speedVariation of [0,100]){
 const cfg={style,stagger,speedVariation,rows:8,columns:8,slats:20},a=pose(.599999/4,cfg),b=pose(.6/4,cfg);assert.ok(a[0].instances.length>0);assert.equal(b[0].instances.length,1);for(const t of a[0].instances)assert.ok(t.reveal>.99999,JSON.stringify({style,stagger,speedVariation,reveal:t.reveal}));for(const [u,v] of [[.1,.1],[.5,.5],[.9,.9]])assert.equal(topAt(a,r.cx+(u-.5)*r.width,r.cy+(v-.5)*r.height),topAt(b,r.cx+(u-.5)*r.width,r.cy+(v-.5)*r.height));
}
for(const style of ['grid','blinds'])for(const frameRatio of ['auto','16:9','9:16'])for(const [w,h] of [[1280,720],[390,844]])for(const cornerRadius of [0,12]){
 const cfg={style,frameRatio,cornerRadius,rows:8,columns:8,slats:20,stagger:100,speedVariation:100},a=pose(0,cfg,8,w,h),seen=new Set();
 for(let sample=0;sample<32;sample++)for(const c of pose(sample/32,cfg,8,w,h)){assert.deepEqual([c.textureWidth,c.textureHeight,c.corner],[a[c.slot].textureWidth,a[c.slot].textureHeight,0]);assert.equal(c.visible,c.instances.length>0);assert.ok(c.width>0&&c.width<=w+1e-6&&c.height>0&&c.height<=h+1e-6);for(const t of c.instances){seen.add(c.slot);assert.deepEqual(t.rounded,t.panelClip);assert.deepEqual(t.upper,c.upper);assert.deepEqual(t.lower,c.lower);assert.ok(t.rounded.radius<=Math.min(t.rounded.width,t.rounded.height)/2);for(const p of t.polygon)assert.ok(p.x>=c.clip.left-1e-6&&p.x<=c.clip.left+c.clip.width+1e-6&&p.y>=c.clip.top-1e-6&&p.y<=c.clip.top+c.clip.height+1e-6);}}
 assert.equal(seen.size,8);
}
for(const offsetX of [-50,50])for(const offsetY of [-50,50])for(const c of pose(.08,{frameRatio:'auto',offsetX,offsetY},8,390,844))assert.ok(c.width>0&&c.height>0&&c.upper.concat(c.lower).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
const a=pose(.08),scaled=pose(.08,{},4,2560,1440),offset=pose(.08,{offsetX:4,offsetY:-3});for(let i=0;i<4;i++){near(scaled[i].textureWidth,a[i].textureWidth*2);near(scaled[i].textureHeight,a[i].textureHeight*2);near(offset[i].upper[0].x-a[i].upper[0].x,28.8);near(offset[i].upper[0].y-a[i].upper[0].y,-21.6);}
const scroll={...defaults,turns:3,start:20,end:80};assert.deepEqual(plain(model.layout(1280,720,scroll,.1,4,1,true)),plain(model.layout(1280,720,scroll,.9,4,1,true)));
const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,8,1,true)),plain(model.layout(390,844,scroll,.317,8,1,true)));
console.log('Mosaic Wipe: defaults/bounds, 2–8 sources, five deterministic grid patterns, both blinds orientations/four openings, stagger/speed variation, completion at extremes, masks/full-source crop, hold/loop, stable textures/bounded geometry, scale/offsets, scroll/exported factory OK');
