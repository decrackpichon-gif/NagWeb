import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),context);
const model=context.window.NAGWEB_STREAM_MODEL,plain=v=>JSON.parse(JSON.stringify(v)),defaults=plain(model.config({kind:'card-toss'}));
assert.equal(defaults.cardSize,26);assert.equal(defaults.sizeVar,20);assert.equal(defaults.throwHeight,75);assert.equal(defaults.spread,70);assert.equal(defaults.spin,12);assert.equal(defaults.flow,'staggered');assert.equal(defaults.cardRatio,'3:4');assert.equal(defaults.offsetX,0);assert.equal(defaults.offsetY,0);
const center=n=>({x:(n.upper[0].x+n.lower[1].x)/2,y:(n.upper[0].y+n.lower[1].y)/2});
for(const [width,height] of [[1280,720],[390,844]])for(const count of [4,8,16])for(const flow of ['one','staggered'])for(const frameRatio of ['auto','16:9','9:16'])for(const cardRatio of ['auto','1:1','3:4','16:9','9:16']){
 const c={kind:'card-toss',flow,frameRatio,cardRatio},layout=p=>plain(model.layout(width,height,c,p,count,1.6,false)),start=layout(0),seen=new Set();assert.equal(start.length,count);assert.deepEqual(start,layout(1),'A complete cycle closes exactly');
 for(let sample=0;sample<96;sample++){
  const cards=layout(sample/96);assert.ok(cards.filter(n=>n.active).length<=(flow==='one'?1:3),'Launch rhythm limits simultaneous cards');
  for(const [i,n] of cards.entries()){
   assert.equal(n.slot,i);assert.equal(n.depth,i);assert.deepEqual([n.textureWidth,n.textureHeight,n.corner],[start[i].textureWidth,start[i].textureHeight,start[i].corner],'Movement reuses its image texture');assert.ok(n.width<=n.clip.width+1e-7&&n.height<=n.clip.height+1e-7);assert.equal(n.alpha,n.visible?1:0);if(n.visible)seen.add(n.slot);
   if(!n.active){assert.equal(n.flight,null);assert.equal(n.visible,false);continue;}
   assert.ok(n.flight>=0&&n.flight<1);assert.equal(n.upper.length,2);assert.equal(n.lower.length,2);const [a,b]=n.upper,[d,e]=n.lower,u={x:b.x-a.x,y:b.y-a.y},v={x:d.x-a.x,y:d.y-a.y};assert.ok(Math.abs(u.x*v.x+u.y*v.y)<1e-6,'Rotation preserves rectangular images');assert.ok(Math.abs(Math.hypot(u.x,u.y)/Math.hypot(v.x,v.y)-(model.ratios[cardRatio]||1.6))<1e-7,'Card proportions do not change while flying');assert.ok(Math.abs(e.x-b.x-d.x+a.x)<1e-7&&Math.abs(e.y-b.y-d.y+a.y)<1e-7);for(const p of n.upper.concat(n.lower))assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
  }
 }
 assert.equal(seen.size,count,'Every image enters the frame');const a=layout(.237),b=plain(model.layout(width*2,height*2,c,.237,count,1.6,false));for(let i=0;i<count;i++){for(const key of ['left','top','textureWidth','textureHeight','corner'])assert.ok(Math.abs(b[i][key]-a[i][key]*2)<1e-6);if(a[i].visible)for(const key of ['width','height'])assert.ok(Math.abs(b[i][key]-a[i][key]*2)<1e-6);for(const side of ['upper','lower'])a[i][side].forEach((p,j)=>{for(const key of ['x','y'])assert.ok(Math.abs(b[i][side][j][key]-p[key]*2)<1e-6);});}
}
for(const flow of ['one','staggered']){
 const c={...defaults,flow},count=8,span=flow==='one'?1/count:2.6/count,pose=(p,raw=c)=>plain(model.layout(1280,720,raw,p,count,1,false));
 const rise=pose(span*.25)[0],peak=pose(span*.5)[0],fall=pose(span*.75)[0];assert.ok(center(rise).y>center(peak).y);assert.ok(center(fall).y>center(peak).y);assert.ok(Math.abs(center(rise).y-center(fall).y)<1e-6,'The throw follows a symmetric arc');assert.ok(Math.abs(center(peak).x-(center(rise).x+center(fall).x)/2)<1e-6,'Horizontal drift remains smooth');assert.notEqual(rise.rotation,fall.rotation);
 for(let slot=0;slot<count;slot++){const n=pose((slot/count+span*.5)%1)[slot];assert.ok(n.active&&n.visible);assert.ok(Math.abs(n.flight-.5)<1e-7);}
 assert.ok(center(pose(span*.5,{...c,throwHeight:95})[0]).y<center(pose(span*.5,{...c,throwHeight:40})[0]).y);const moved=pose(span*.5,{...c,offsetX:10,offsetY:-5})[0];assert.ok(center(moved).x>center(peak).x&&center(moved).y<center(peak).y);
 for(const n of pose(span*.5,{...c,spin:0}))if(n.active)assert.equal(n.rotation,0);for(const n of pose(span*.5,{...c,sizeVar:0}))assert.equal(n.scale,1);
 assert.notDeepEqual(pose(span*.5,{...c,spread:0}),pose(span*.5,{...c,spread:100}));
}
const limited=model.config({kind:'card-toss',cardSize:1000,sizeVar:1000,throwHeight:-1,spin:1000,spread:-10,flow:'invalid'});assert.equal(limited.cardSize,45);assert.equal(limited.sizeVar,50);assert.equal(limited.throwHeight,40);assert.equal(limited.spin,45);assert.equal(limited.spread,0);assert.equal(limited.flow,'staggered');assert.equal(model.layout(1280,720,defaults,0,100).length,16);assert.equal(model.layout(1280,720,defaults,0,1).length,4);
const scroll={...defaults,turns:3,start:20,end:80};assert.equal(model.phase(.1,scroll,true),0);assert.equal(model.phase(.5,scroll,true),1.5);assert.equal(model.phase(.9,scroll,true),3);assert.deepEqual(plain(model.layout(1280,720,scroll,.1,8,1,true)),plain(model.layout(1280,720,scroll,.9,8,1,true)));
const exported=vm.runInNewContext('('+context.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,{...scroll,flow:'one',spin:45},.317,16,1,true)),plain(model.layout(390,844,{...scroll,flow:'one',spin:45},.317,16,1,true)));
console.log('Card Toss: 4–16 imágenes, subida/apogeo/caída, ritmos, proporciones sin deformar, giro/altura/tamaño/dispersión y posición, geometría acotada, texturas estables, cierre exacto, escala proporcional, Scroll y fábrica exportada OK');
