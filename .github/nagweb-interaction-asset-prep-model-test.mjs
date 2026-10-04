import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const A=require('../js/nagweb-interaction-asset-prep-v1.js');

assert.equal(A.version,'1.2.0');

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
const profile=A.createProfile(horizontal,{leadEnd:'left',cropPadding:.02});
assert.equal(profile.schema,'nagweb-interaction-asset-profile');
assert.equal(profile.organic.leadEnd,'left');
assert.equal(profile.readiness.organicCandidate,true);
const restored=A.deserializeProfile(A.serializeProfile(profile));
assert.equal(restored.geometry.principalAxisAngle,profile.geometry.principalAxisAngle);
assert.equal(restored.organic.cropPadding,.02);

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


const axis=A.axisAnchors({
  width:400,height:200,sampleWidth:400,sampleHeight:200,
  centroid:{x:.5,y:.5},subjectBounds:{x:.1,y:.2,width:.8,height:.6},principalAxisAngle:0
});
assert.ok(Math.abs(axis.start.x-.1)<.001&&Math.abs(axis.end.x-.9)<.001,'auto axis should intersect subject bounds');
assert.ok(Math.abs(A.axisAngleFromAnchors({x:.2,y:.5},{x:.8,y:.5},400,200))<.001);
assert.ok(Math.abs(A.axisAngleFromAnchors({x:.5,y:.8},{x:.5,y:.2},400,200)+90)<.001);

const manualProfile=A.createProfile({
  width:400,height:200,sampleWidth:400,sampleHeight:200,sourceWidth:800,sourceHeight:400,
  silhouetteReliable:true,needsBackgroundRemoval:false,organicCandidate:true,recommendedMode:'organic',
  subjectBounds:{x:.1,y:.2,width:.8,height:.6},centroid:{x:.5,y:.5},principalAxisAngle:0,elongation:2.4,warnings:[]
},{trailAnchor:{x:.2,y:.8},leadAnchor:{x:.8,y:.2}});
assert.equal(manualProfile.organic.directionSource,'manual');
assert.ok(manualProfile.organic.axisAngle<0);


const legacy=A.deserializeProfile({
  schema:A.profileSchema,version:1,source:{width:400,height:200},
  readiness:{backgroundReady:true,silhouetteReliable:true,organicCandidate:true,recommendedMode:'organic'},
  geometry:{subjectBounds:{x:.1,y:.2,width:.8,height:.6},centroid:{x:.5,y:.5},principalAxisAngle:0,elongation:2.4},
  organic:{leadEnd:'right',cropPadding:.015},warnings:[]
});
assert.ok(legacy.organic.trailAnchor.x<legacy.organic.leadAnchor.x,'legacy profiles should migrate to usable anchors');
const swapped=A.swapOrganicDirection(legacy);
assert.ok(swapped.organic.trailAnchor.x>swapped.organic.leadAnchor.x,'direction swap should exchange anchors');
assert.equal(swapped.organic.directionSource,'manual');

const autoProfile=A.createProfile({
  width:400,height:200,sampleWidth:400,sampleHeight:200,sourceWidth:800,sourceHeight:400,
  silhouetteReliable:true,needsBackgroundRemoval:false,organicCandidate:true,recommendedMode:'organic',
  subjectBounds:{x:.1,y:.2,width:.8,height:.6},centroid:{x:.5,y:.5},principalAxisAngle:0,elongation:2.4,warnings:[]
},{trailAnchor:{x:.1,y:.5},leadAnchor:{x:.9,y:.5},directionSource:'auto'});
assert.equal(autoProfile.organic.directionSource,'auto');
console.log('NagWeb Interaction Asset Prep V1.2 model tests: PASS');
