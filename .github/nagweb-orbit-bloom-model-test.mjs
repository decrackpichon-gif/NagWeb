import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../js/nagweb-story-model.js',import.meta.url),'utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),c=model.config({kind:'orbit-bloom'});
assert.equal(c.lean,0);assert.equal(c.curve,0);assert.equal(c.ringWidth,50);assert.equal(c.ringHeight,25);assert.equal(c.cardSize,24);assert.equal(c.cardRatio,'1:1');assert.equal(c.direction,'right');assert.equal(c.motion,'linear');
for(const count of [4,8,12,16])for(const [width,height] of [[1280,720],[390,240],[220,280]])for(const curve of [-80,0,80]){
 const cfg={...c,curve,frameRatio:'auto'},layout=p=>model.layout(width,height,cfg,p,count),initial=layout(0),seen=Array(count).fill(false);
 assert.deepEqual(plain(initial),plain(layout(1)),'The petals close their cycle exactly');
 for(const p of [0,.13,.25,.5,.73,.9]){
  const cards=layout(p);assert.equal(cards.length,count);assert.equal(new Set(cards.map(n=>n.slot)).size,count);
  assert.ok(cards.every((n,i)=>i===0||cards[i-1].depth<=n.depth),'Depth orders the petals');
  for(const card of cards){
   assert.ok(card.alpha>=.55-1e-9&&card.alpha<=1);seen[card.slot]||=card.visible;
   const first=initial.find(n=>n.slot===card.slot);assert.equal(card.textureWidth,first.textureWidth);assert.equal(card.textureHeight,first.textureHeight);assert.equal(card.corner,first.corner,'Textures remain stable throughout the rotation');
   if(curve===0)assert.equal(card.upper.length,2);else assert.ok(card.upper.length>4&&card.upper.length<=129,'Curves use bounded subdivisions');
   for(const point of [...card.upper,...card.lower])assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y)&&point.x>=card.left&&point.x<=card.left+card.width&&point.y>=card.top&&point.y<=card.top+card.height);
  }
 }
 assert.ok(seen.every(Boolean),'Every petal has a visible face during its cycle');
 const once=layout(.13),twice=model.layout(width*2,height*2,cfg,.13,count);
 for(const card of once){const doubled=twice.find(n=>n.slot===card.slot);for(const edge of ['upper','lower'])for(const j of [0,card[edge].length-1])for(const axis of ['x','y'])assert.ok(Math.abs(doubled[edge][j===0?0:doubled[edge].length-1][axis]-card[edge][j][axis]*2)<1e-8);}
}
const pose=(cfg,p)=>plain(model.layout(1280,720,cfg,p,12)),forward=pose(c,.2),reverse=pose({...c,direction:'left'},.8);
for(const card of forward){const other=reverse.find(n=>n.slot===card.slot);for(const edge of ['upper','lower'])for(let j=0;j<2;j++)for(const axis of ['x','y'])assert.ok(Math.abs(card[edge][j][axis]-other[edge][j][axis])<1e-8,'Direction reverses the same orbit');}
assert.notDeepEqual(pose({...c,motion:'pulse'},.25),pose(c,.25));assert.deepEqual(pose({...c,motion:'pulse'},0),pose({...c,motion:'pulse'},1));
assert.notDeepEqual(pose({...c,lean:70},.13),pose(c,.13));assert.notDeepEqual(pose({...c,curve:70},.13),pose({...c,curve:-70},.13));
const edgeOn=model.layout(1280,720,c,0,12).find(n=>n.slot===0);assert.equal(edgeOn.visible,false,'Edge-on cards cannot capture clicks over other petals');
const sequence={...c,turns:3,start:20,end:80};assert.equal(model.phase(.1,sequence,true),0);assert.equal(model.phase(.5,sequence,true),1.5);assert.equal(model.phase(.9,sequence,true),3);assert.deepEqual(plain(model.layout(1280,720,sequence,.1,12,1,true)),plain(model.layout(1280,720,sequence,.9,12,1,true)));
assert.equal(model.config({kind:'orbit-bloom',cardSize:1000,perspective:500}).cardSize,80);assert.equal(model.config({kind:'orbit-bloom',perspective:500}).perspective,100);assert.equal(model.layout(1280,720,c,0,100).length,16);
const serialized=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(serialized.layout(1280,720,{...sequence,curve:-60,lean:55},.32,12,1,true)),plain(model.layout(1280,720,{...sequence,curve:-60,lean:55},.32,12,1,true)));
console.log('Orbit Bloom: 4–16 pétalos, profundidad, sentido y ritmo, inclinación y curvatura, caras visibles, cierre exacto, texturas estables, escalado proporcional, Scroll y fábrica exportada OK');
