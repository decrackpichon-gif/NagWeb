import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source=await fs.readFile(new URL('../js/nagweb-story-model.js',import.meta.url),'utf8');
const context={window:{}};
vm.runInNewContext(source.slice(0,source.indexOf('/* Modelo puro, compartido')),context,{filename:'nagweb-story-model.js'});
const model=context.window.NAGWEB_STREAM_MODEL;
assert.ok(model,'Motion stream model available');
for(const perspective of [0,18,40]){
 for(const ratio of ['auto','16:9','9:16']){
  for(const progress of [0,.125,.25,.5,.75,.999]){
   const cards=model.layout(960,540,{kind:'showcase-stream',perspective,cardRatio:ratio},progress,12,16/9,false);
   assert.equal(cards.length,12);
   assert.equal(new Set(cards.map(c=>c.slot)).size,12);
   for(const c of cards){
    assert.ok(c.width>0&&c.height>0&&Number.isFinite(c.width)&&Number.isFinite(c.height));
    assert.ok(c.corner>=0&&c.corner<=Math.min(c.textureWidth,c.textureHeight)/2+1e-6);
    assert.ok(c.alpha>=0&&c.alpha<=1);
    assert.equal(c.upper.length,c.lower.length);
    assert.ok(c.upper.length>=17&&c.upper.length<=97);
    for(const p of c.upper.concat(c.lower))assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
   }
  }
 }
}
console.log('Showcase geometry regression passed');
