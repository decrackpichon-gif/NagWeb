import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const A=require('../js/nagweb-interaction-asset-prep-v1.js');

assert.equal(A.version,'1.0.0');

function pixels(w,h,inside){
  const data=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4;data[i]=220;data[i+1]=120;data[i+2]=80;data[i+3]=inside(x,y)?255:0;
  }
  return {data,width:w,height:h};
}

const horizontal=A.analyzePixels(pixels(120,80,(x,y)=>x>=10&&x<=109&&y>=30&&y<=49));
assert.equal(horizontal.hasTransparency,true);
assert.equal(horizontal.silhouetteReliable,true);
assert.equal(horizontal.recommendedMode,'organic');
assert.ok(horizontal.elongation>4);
assert.ok(Math.abs(horizontal.principalAxisAngle)<2);
assert.ok(horizontal.subjectBounds.x>0&&horizontal.subjectBounds.width<1);

const vertical=A.analyzePixels(pixels(80,120,(x,y)=>x>=30&&x<=49&&y>=10&&y<=109));
assert.ok(vertical.elongation>4);
assert.ok(Math.abs(Math.abs(vertical.principalAxisAngle)-90)<2);

const opaque=A.analyzePixels(pixels(80,60,()=>true));
assert.equal(opaque.hasTransparency,false);
assert.equal(opaque.silhouetteReliable,false);
assert.equal(opaque.needsBackgroundRemoval,true);
assert.equal(opaque.recommendedMode,'follower');
assert.ok(opaque.warnings.length>0);

const tiny=A.analyzePixels(pixels(100,100,(x,y)=>x>48&&x<52&&y>48&&y<52));
assert.ok(tiny.warnings.some(x=>x.includes('resolución')));

console.log('NagWeb Interaction Asset Prep V1 model tests: PASS');
