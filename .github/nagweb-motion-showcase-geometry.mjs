import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

// Load the complete shared model. The previous slice ended at the file's
// opening comment and silently evaluated an empty program.
const source=await fs.readFile(new URL('../js/nagweb-story-model.js',import.meta.url),'utf8');
const scope={window:{}};
vm.runInNewContext(source,scope,{filename:'nagweb-story-model.js'});
const model=scope.window.NAGWEB_STREAM_MODEL;
assert.ok(model&&typeof model.layout==='function','Shared procedural model loads');
const plain=x=>JSON.parse(JSON.stringify(x));
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-7,message+': '+a+' vs '+b);
let inspected=0;

for(const perspective of [0,18,40]){
 for(const ratio of ['auto','16:9','9:16']){
  for(const progress of [0,.125,.25,.5,.75,.999]){
   const cards=plain(model.layout(960,540,{kind:'showcase-stream',perspective,cardRatio:ratio,cornerRadius:3},progress,12,16/9,false));
   assert.equal(cards.length,12);
   assert.equal(new Set(cards.map(c=>c.slot)).size,12,'One rendered surface per media slot');
   assert.ok(cards.every((c,i)=>!i||c.depth>=cards[i-1].depth),'Painter order follows depth');
   for(const c of cards){
    inspected++;
    assert.ok(c.width>0&&c.height>0&&Number.isFinite(c.width)&&Number.isFinite(c.height));
    near(c.corner,Math.min(c.textureWidth,c.textureHeight)*.03,'3% rounded corner');
    assert.ok(c.alpha>=0&&c.alpha<=1);
    assert.equal(c.upper.length,c.lower.length);
    assert.equal(c.stripDepth.length,c.upper.length-1,'One depth for each curved texture strip');
    assert.ok(c.stripDepth.every(d=>Number.isFinite(d)&&d>=-1&&d<=1),'Curved strip depth is normalized');
    assert.ok(c.upper.length>=17&&c.upper.length<=97);
    for(const p of c.upper.concat(c.lower))assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y),'Finite mesh vertex');
    const points=c.upper.concat(c.lower);
    assert.ok(points.every(p=>p.x>=c.left&&p.x<=c.left+c.width&&p.y>=c.top&&p.y<=c.top+c.height),'Surface fits raster bounds');
   }
  }
 }
}

// Curved cards cannot be treated as a single plane: end strips may overlap
// another card at a different depth than the center strip.
let curvedOcclusions=0;
for(const progress of [0,.125,.25,.375,.5,.625,.75,.875]){
 const cards=model.layout(960,540,{kind:'showcase-stream',ringTilt:-28,cardSize:40,perspective:18},progress,12,16/9,false);
 for(const card of cards){
  if(Math.max(...card.stripDepth)-Math.min(...card.stripDepth)>1e-3)curvedOcclusions++;
 }
}
assert.ok(curvedOcclusions>0,'Curved cards expose meaningful per-strip depth');

// Corner percentages remain proportional even when a user changes the format,
// canvas orientation, image size, or corners in the inspector.
for(const [width,height] of [[960,540],[540,960]]){
 for(const cornerRadius of [0,3,10,12]){
  const cards=model.layout(width,height,{kind:'showcase-stream',cardRatio:'9:16',cornerRadius},.2,12,16/9,false);
  for(const c of cards)near(c.corner,Math.min(c.textureWidth,c.textureHeight)*cornerRadius/100,'Card radius percent');
 }
}

// Verify exact loop closure and that Scroll holds the start/end poses.
const cfg={kind:'showcase-stream',ringTilt:-28,ringOpening:55,perspective:18};
const pose=(p,config=cfg,scroll=false)=>plain(model.layout(960,540,config,p,12,16/9,scroll));
assert.deepEqual(pose(0),pose(1),'Time-mode loop has no seam');
const scrollCfg={...cfg,start:20,end:80,turns:1};
assert.deepEqual(pose(.1,scrollCfg,true),pose(0,scrollCfg,false),'Scroll before range holds first pose');
assert.deepEqual(pose(.9,scrollCfg,true),pose(1,scrollCfg,false),'Scroll after range holds last pose');
const neutral=pose(0,{...cfg,perspective:0}),strong=pose(0,{...cfg,perspective:40});
const widthAt=(cards,depth)=>cards.find(c=>Math.abs(c.depth-depth)<1e-8).width;
assert.ok(widthAt(strong,1)>widthAt(neutral,1),'Perspective grows front-facing cards');
assert.ok(widthAt(strong,-1)<widthAt(neutral,-1),'Perspective shrinks rear cards');
console.log('Showcase geometry OK: '+inspected+' surfaces, perspective, raster bounds, corner percentages, exact loops and scroll clamps');


// The padded scene must remain visible even with large cards and maximum perspective.
// Exercise the common landscape/square/portrait layouts through an entire revolution.
let checkedPaddedScenes=0;
for(const [width,height,frameRatio] of [[960,540,'16:9'],[600,600,'1:1'],[540,960,'9:16']]){
 for(const cardSize of [21,50,80]){
  for(const perspective of [0,18,40]){
   for(const progress of [0,.125,.25,.5,.75,.999]){
    const padding=Math.min(width,height)*.06;
    const cards=model.layout(width,height,{kind:'showcase-stream',frameRatio,ringTilt:-28,cardSize,perspective,padding:6},progress,12,16/9,false);
    assert.equal(cards.length,12,'All slots retained after responsive scaling');
    for(const card of cards){
     for(const pt of card.upper.concat(card.lower)){
      assert.ok(Math.abs(pt.x-width/2)<=width/2-padding+.1,'No card exceeds horizontal safe area');
      assert.ok(Math.abs(pt.y-height/2)<=height/2-padding+.1,'No card exceeds vertical safe area');
     }
    }
    checkedPaddedScenes++;
   }
  }
 }
}
console.log('Showcase padded geometry OK: '+checkedPaddedScenes+' responsive/perspective combinations');
