import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const js=await fs.readFile(new URL('../js/nagweb-story-model.js',import.meta.url),'utf8');
const env={window:{}};
vm.runInNewContext(js,env,{filename:'nagweb-story-model.js'});
const model=env.window.NAGWEB_STREAM_MODEL;
assert.ok(model&&typeof model.layout==='function','Shared motion model is available');

// Cross-preset invariant: changing the original radius control must not modify motion geometry.
const direct=['orbit-showcase','cover-ring','cover-ring-vertical','cover-flow','cover-flow-vertical','wheel-carousel','wheel-spin','wheel-spin-bottom','spiral-stream','focus-slider','orbit-globe','sphere-globe','vortex-spin','sphere-wall','sphere-cascade','totem-wall','parallax-totem','flip-grid','grid-dive','mosaic-marquee'];
const indirect=['mosaic-wipe','stripe-reveal','diagonal-wipe','split-reveal','scatter-dial','fan-shuffle','feed-scroll','sweep-ring','spread-rows','spread-columns','depth-stack-scroll','grid-zoom-strip','collage-reel','triple-scene','hero-reel'];
let checked=0,images=0;
for(const kind of direct.concat(indirect)){
 for(const [width,height] of [[960,540],[540,960]]){
  for(const progress of [0,.25,.625]){
   const poses=[0,3,12].map(cornerRadius=>model.layout(width,height,{kind,cornerRadius},progress,12,16/9,false));
   const slots=poses[0].length;
   assert.ok(slots>0,'Template has cards: '+kind);
   for(let p=0;p<poses.length;p++){
    const radius=[0,3,12][p];
    assert.equal(poses[p].length,slots,'Corner adjustment does not add/delete media slots: '+kind);
    poses[p].forEach((card,i)=>{
     const previous=poses[0][i];
     for(const prop of ['slot','depth','alpha','left','top','width','height']){
      assert.equal(card[prop],previous[prop],'Corner editing preserves geometry ('+kind+' / '+prop+')');
     }
     assert.ok(Number.isFinite(card.corner)&&card.corner>=0,'Card has a finite nonnegative corner: '+kind);
     // Radius semantics vary by the original Animos preset. Never replace the HAR oracle
     // with a global short-edge formula: source-specific tests verify exact geometry.
     for(const instance of card.instances||[]){
      if(instance.rounded){
       assert.ok(Number.isFinite(instance.rounded.radius)&&instance.rounded.radius>=0,'Valid rounded mesh: '+kind);
       assert.ok(instance.rounded.radius<=Math.min(instance.rounded.width,instance.rounded.height)/2+1e-6,'Mesh corner stays bounded: '+kind);
      }
     }
     images++;
    });
   }
   checked++;
  }
 }
}
console.log('Motion corner isolation regression passed: '+checked+' configurations, '+images+' card surfaces across '+(direct.length+indirect.length)+' presets');
