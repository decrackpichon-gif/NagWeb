import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const scope={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../js/nagweb-story-model.js',import.meta.url),'utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),config=model.config({kind:'iso-orbit'});
assert.equal(config.cardRatio,'1:1');assert.equal(config.motion,'swing');
for(const motion of ['swing','spin'])for(const [width,height] of [[1280,720],[390,240],[220,280]]){
 const c={...config,motion,frameRatio:'auto'};
 const initial=plain(model.layout(width,height,c,0,9)),end=plain(model.layout(width,height,c,1,9));
 assert.deepEqual(initial,end,'Both motions close with identical geometry');
 assert.notDeepEqual(initial,plain(model.layout(width,height,c,.25,9)));
 for(let p=0;p<=1;p+=.05){const cards=model.layout(width,height,c,p,9);assert.equal(cards.length,9);assert.equal(new Set(cards.map(n=>n.slot)).size,9);
  for(const card of cards){assert.ok(card.left>=0&&card.top>=0&&card.left+card.width<=width&&card.top+card.height<=height,'The default grid fits its viewport throughout the cycle');const [a,b]=card.upper,[d,e]=card.lower;assert.ok(Math.abs((b.x-a.x)-(e.x-d.x))<1e-7&&Math.abs((b.y-a.y)-(e.y-d.y))<1e-7,'Images are flat affine planes');assert.ok(card.textureWidth>0&&card.textureHeight>0);}
  assert.ok(cards.every((n,i)=>!i||n.depth>=cards[i-1].depth));
 }
}
const sequence={...config,motion:'spin',turns:3,start:20,end:80};assert.equal(model.phase(.1,sequence,true),0);assert.equal(model.phase(.5,sequence,true),1.5);assert.equal(model.phase(.9,sequence,true),3);assert.deepEqual(plain(model.layout(1280,720,sequence,.1,9,1,true)),plain(model.layout(1280,720,sequence,.9,9,1,true)));
const invalid=model.config({kind:'iso-orbit',tilt:0,spacing:Infinity,orbitSize:1000,motion:'invalid'});assert.equal(invalid.tilt,20);assert.equal(invalid.spacing,18);assert.equal(invalid.orbitSize,130);assert.equal(invalid.motion,'swing');
const serialized=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(serialized.layout(1280,720,sequence,.35,9,1,true)),plain(model.layout(1280,720,sequence,.35,9,1,true)),'Exported factory uses identical geometry');
console.log('Iso Orbit: nueve planos afines, grilla contenida, oscilación/giro con cierre exacto, profundidad, ciclos de scroll, límites y fábrica exportada OK');
