import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../js/nagweb-story-model.js',import.meta.url),'utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),c=model.config({kind:'center-stage'});
assert.equal(c.travel,60);assert.equal(c.cardSize,86);assert.equal(c.ghosts,true);
for(const count of [2,3,4,6])for(const [width,height] of [[1280,720],[390,240],[220,280]]){
 const cfg={...c,frameRatio:'auto'},at=(local,slot=0)=>model.layout(width,height,cfg,(slot+local)/count,count);
 assert.deepEqual(plain(at(0)),plain(model.layout(width,height,cfg,1,count)),'The whole sequence closes exactly');
 for(let slot=0;slot<count;slot++){
  const held=at(.5,slot),visible=held.filter(n=>n.alpha>0);assert.equal(visible.length,1);assert.equal(visible[0].slot,slot);assert.equal(visible[0].alpha,1);
  const entry=at(.1,slot).find(n=>n.slot===slot),exit=at(.9,slot).find(n=>n.slot===slot),center=visible[0];
  const cx=n=>(n.upper[0].x+n.upper[1].x)/2;
  assert.ok(cx(entry)>width/2&&cx(exit)<width/2,'Images enter from the right and exit to the left');assert.equal(cx(center),width/2);
  assert.ok(entry.alpha>0&&entry.alpha<1&&exit.alpha>0&&exit.alpha<1);assert.equal(entry.trails.length,0);assert.equal(center.trails.length,0);assert.equal(exit.trails.length,3);
  const noTrails=model.layout(width,height,{...cfg,ghosts:false},(slot+.9)/count,count).find(n=>n.slot===slot);assert.equal(noTrails.trails.length,0);assert.deepEqual(plain(noTrails.upper),plain(exit.upper));assert.equal(noTrails.alpha,exit.alpha);
  for(const card of [entry,center,exit]){
   assert.equal(card.textureWidth,center.textureWidth);assert.equal(card.textureHeight,center.textureHeight);
   for(const surface of [card,...card.trails])for(const p of [...surface.upper,...surface.lower])assert.ok(p.x>=card.left&&p.x<=card.left+card.width&&p.y>=card.top&&p.y<=card.top+card.height,'Main image and trails fit their canvas');
  }
 }
 const once=at(.9),twice=model.layout(width*2,height*2,cfg,.9/count,count);
 for(let i=0;i<count;i++)for(const edge of ['upper','lower'])for(let j=0;j<2;j++)for(const axis of ['x','y'])assert.ok(Math.abs(twice[i][edge][j][axis]-once[i][edge][j][axis]*2)<1e-8,'Resizing scales every image proportionally');
}
const sequence={...c,turns:3,start:20,end:80};assert.equal(model.phase(.1,sequence,true),0);assert.equal(model.phase(.5,sequence,true),1.5);assert.equal(model.phase(.9,sequence,true),3);
assert.deepEqual(plain(model.layout(1280,720,sequence,.1,3,1,true)),plain(model.layout(1280,720,sequence,.9,3,1,true)));
const invalid=model.config({kind:'center-stage',travel:Infinity,cardSize:500});assert.equal(invalid.travel,60);assert.equal(invalid.cardSize,100);assert.equal(model.layout(1280,720,c,0,100).length,6);assert.equal(model.layout(1280,720,c,0,1).length,2);
const serialized=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(serialized.layout(1280,720,sequence,.32,3,1,true)),plain(model.layout(1280,720,sequence,.32,3,1,true)));
console.log('Center Stage: secuencia ordenada de 2–6 imágenes, entrada/permanencia/salida, estela opcional, cierre exacto, texturas estables, escalado proporcional, ciclos de scroll y fábrica exportada OK');
