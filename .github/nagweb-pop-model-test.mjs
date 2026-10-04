import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../js/nagweb-story-model.js',import.meta.url),'utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),c=model.config({kind:'pop-grid'});
assert.equal(c.gap,3);assert.equal(c.visible,62);
for(const count of [2,3,4,6,9,12])for(const [width,height] of [[1280,720],[390,240],[220,280]]){
 let offbeat=false;const cfg={...c,frameRatio:'auto'},seen=Array.from({length:count},()=>({visible:false,fading:false}));
 assert.deepEqual(plain(model.layout(width,height,cfg,0,count)),plain(model.layout(width,height,cfg,1,count)),'Every tile closes its cycle exactly');
 for(let i=0;i<=100;i++){
  const cards=model.layout(width,height,cfg,i/100,count);offbeat||=new Set(cards.map(n=>n.scale.toFixed(3))).size>1;assert.equal(cards.length,count);assert.equal(new Set(cards.map(n=>n.slot)).size,count);
  for(const card of cards){assert.ok(card.scale>0&&card.scale<1.2);assert.ok(card.alpha>=0&&card.alpha<=1);assert.ok(card.textureWidth>0&&card.textureHeight>0);assert.equal(card.upper.length,2);assert.ok(card.upper[0].y===card.upper[1].y&&card.lower[0].y===card.lower[1].y);seen[card.slot].visible||=card.alpha===1;seen[card.slot].fading||=card.alpha<.2;}
 }
 assert.ok(seen.every(n=>n.visible&&n.fading),'All images have their own appearance and disappearance');
 assert.ok(offbeat,'The grid has offbeat timing');
 const twice=model.layout(width*2,height*2,cfg,.17,count),once=model.layout(width,height,cfg,.17,count);for(let i=0;i<count;i++){assert.ok(Math.abs(twice[i].upper[0].x-once[i].upper[0].x*2)<1e-8);assert.ok(Math.abs(twice[i].lower[1].y-once[i].lower[1].y*2)<1e-8);}
}
const sequence={...c,turns:3,start:20,end:80};assert.equal(model.phase(.1,sequence,true),0);assert.equal(model.phase(.5,sequence,true),1.5);assert.equal(model.phase(.9,sequence,true),3);assert.deepEqual(plain(model.layout(1280,720,sequence,.1,6,1,true)),plain(model.layout(1280,720,sequence,.9,6,1,true)));
const invalid=model.config({kind:'pop-grid',gap:Infinity,visible:500});assert.equal(invalid.gap,3);assert.equal(invalid.visible,85);assert.equal(model.layout(1280,720,c,0,100).length,12);assert.equal(model.layout(1280,720,c,0,1).length,2);
const serialized=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(serialized.layout(1280,720,sequence,.32,6,1,true)),plain(model.layout(1280,720,sequence,.32,6,1,true)));
console.log('Pop Grid: grilla de 2 a 12 imágenes, ritmos independientes, aparición/desaparición, cierre exacto, escalado proporcional, ciclos de scroll, límites y fábrica exportada OK');
