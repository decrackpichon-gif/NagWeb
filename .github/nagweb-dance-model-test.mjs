import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),defaults=model.config({kind:'position-dance'}),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`),pose=(p,c={},w=1280,h=720,ratio=1)=>plain(model.layout(w,h,{...defaults,...c},p,6,ratio));
for(const [key,s] of Object.entries(model.danceSpecs)){assert.equal(defaults[key],s[0]);assert.equal(model.config({kind:'position-dance',[key]:999})[key],s[2]);assert.equal(model.config({kind:'position-dance',[key]:-999})[key],s[1]);}
assert.equal(defaults.kind,'position-dance');assert.equal(defaults.cardRatio,'1:1');assert.equal(defaults.cornerRadius,4);
assert.equal(model.layout(1280,720,defaults,0,1,1).length,6);assert.equal(model.layout(1280,720,defaults,0,99,1).length,6);
const shape=cards=>cards.map(c=>({upper:c.upper,lower:c.lower,instances:c.instances}));
// Independent timing checks: 30% hold of each third, then smooth interpolation; loop closes.
for(let step=0;step<3;step++){
 const a=pose(step/3),held=pose((step+.29)/3),middle=pose((step+.65)/3),b=pose((step+1)/3);
 assert.deepEqual(shape(a),shape(held));assert.notDeepEqual(shape(a),shape(b));
 for(let i=0;i<6;i++){const x=a[i].instances[0].rounded,y=b[i].instances[0].rounded,z=middle[i].instances[0].rounded;for(const k of ['cx','cy','width','height','radius'])near(z[k],(x[k]+y[k])/2);}
 const end=pose((step+1)/3-1e-7);for(let i=0;i<6;i++)near(end[i].upper[0].x,b[i].upper[0].x);
}
assert.deepEqual(pose(0),pose(1));assert.notDeepEqual(shape(pose(0)),shape(pose(1/3)));assert.notDeepEqual(shape(pose(1/3)),shape(pose(2/3)));
for(const spacing of [-20,0,20])for(const cardSize of [16,28,42])for(const cornerRadius of [0,4,12])for(const cardRatio of ['auto','1:1','16:9','9:16'])for(const [w,h,ratio] of [[1280,720,.25],[390,844,4]]){
 const cfg={spacing,cardSize,cornerRadius,cardRatio,frameRatio:'auto'},start=pose(0,cfg,w,h,ratio),seen=new Set();
 for(let sample=0;sample<60;sample++)for(const c of pose(sample/60,cfg,w,h,ratio)){
  assert.equal(c.slot,c.depth);assert.equal(c.visible,c.instances.length===1);assert.equal(c.alpha,c.visible?1:0);assert.ok(c.width>0&&c.width<=w+1e-6&&c.height>0&&c.height<=h+1e-6);assert.deepEqual([c.textureWidth,c.textureHeight,c.corner],[start[c.slot].textureWidth,start[c.slot].textureHeight,start[c.slot].corner]);assert.ok(c.upper.concat(c.lower).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  for(const t of c.instances){seen.add(c.slot);near(t.rounded.width,c.textureWidth*t.scale);near(t.rounded.height,c.textureHeight*t.scale);near(t.rounded.radius,c.corner*t.scale);assert.equal(t.rounded.angle,0);assert.equal(t.depth,c.slot);assert.equal(t.alpha,1);assert.ok(t.rounded.radius<=Math.min(t.rounded.width,t.rounded.height)/2+1e-6);near(t.upper[0].x,t.upper[1].x);near(t.lower[0].x,t.lower[1].x);}
 }
 assert.equal(seen.size,6);
}
// Spacing scales rectangles around their original centers, without changing the corner radius.
for(const p of [0,.17,1/3,.5,2/3,.9])for(const spacing of [-20,20]){const a=pose(p),b=pose(p,{spacing});for(let i=0;i<6;i++){const x=a[i].instances[0].rounded,y=b[i].instances[0].rounded;near(x.cx,y.cx);near(x.cy,y.cy);near(y.width,x.width*(1+spacing/100));near(y.height,x.height*(1+spacing/100));near(x.radius,y.radius);}}
const a=pose(.5),scaled=pose(.5,{},2560,1440),offset=pose(.5,{offsetX:4,offsetY:-3});for(let i=0;i<6;i++){const x=a[i].instances[0].rounded,y=scaled[i].instances[0].rounded,z=offset[i].instances[0].rounded;for(const k of ['cx','cy','width','height','radius'])near(y[k],x[k]*2);near(z.cx-x.cx,28.8);near(z.cy-x.cy,-21.6);}
for(const offsetX of [-50,50])for(const offsetY of [-50,50])for(const c of pose(.5,{offsetX,offsetY,cardSize:42,spacing:20,cardRatio:'auto'},390,844,.25)){assert.ok(c.width>=1&&c.height>=1);assert.ok(c.upper.concat(c.lower).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));}
const scroll={...defaults,turns:3,start:20,end:80};assert.deepEqual(plain(model.layout(1280,720,scroll,.1,6,1,true)),plain(model.layout(1280,720,scroll,.9,6,1,true)));
const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,6,1,true)),plain(model.layout(390,844,scroll,.317,6,1,true)));
console.log('Position Dance: defaults/bounds, fixed six sources, three poses, hold/easing/loop, spacing/independent corners, source paint order, bounded geometry/ratios, stable textures, scale/offsets, scroll and exported factory OK');
