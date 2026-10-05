import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const V4C=require('../js/nagweb-interaction-organic-v4c.js');

assert.equal(V4C.version,'4.3.1-alpha.1');
assert.ok(V4C.presets.character&&V4C.presets.creature&&V4C.presets.soft);

function makeImage(w,h,widthFn){
  const data=new Uint8ClampedArray(w*h*4);
  for(let x=0;x<w;x++){
    const u=1-x/(w-1),half=Math.max(1,Math.round(widthFn(u)*h*.5)),cy=Math.round(h*.5);
    for(let y=Math.max(0,cy-half);y<=Math.min(h-1,cy+half);y++){
      const i=(y*w+x)*4;data[i]=255;data[i+1]=120;data[i+2]=80;data[i+3]=255;
    }
  }
  return {data,width:w,height:h};
}

const synthetic=makeImage(160,100,u=>{
  if(u<.16)return .22;        // head/neck-ish narrow
  if(u<.38)return .72;        // wide torso
  if(u<.55)return .42;        // waist
  if(u<.80)return .82;        // wide robe/body
  return .30;                 // tail/lower taper
});
const profile=V4C.analyzeAlphaData(synthetic.data,synthetic.width,synthetic.height,{profileSamples:80,profileSmoothRadius:2});
assert.equal(profile.samples,80);
assert.ok(profile.maxWidth>.70&&profile.maxWidth<.90);
assert.ok(profile.meanWidth>.30);
assert.equal(profile.points[0].u,0);
assert.equal(profile.points.at(-1).u,1);
assert.ok(profile.points.every(p=>Number.isFinite(p.width)&&Number.isFinite(p.gradientNorm)));

const head=V4C.profileAt(profile,.08),torso=V4C.profileAt(profile,.25),waist=V4C.profileAt(profile,.47),robe=V4C.profileAt(profile,.70);
assert.ok(torso.width>head.width);
assert.ok(robe.width>waist.width);

const adaptive=V4C.deriveAdaptiveControls(profile,{adaptivePreset:'character',controlCount:9,spinePoints:38});
assert.equal(adaptive.positions.length,9);
assert.equal(adaptive.flex.length,9);
assert.equal(adaptive.bend.length,9);
assert.ok(adaptive.details.every(d=>Number.isFinite(d.flex)&&Number.isFinite(d.bend)&&d.flex>0&&d.bend>0));

// Adaptive mode must actually differ from the baseline at multiple control points.
const changed=adaptive.details.filter(d=>Math.abs(d.flex-d.baseFlex)>.005||Math.abs(d.bend-d.baseBend)>.005);
assert.ok(changed.length>=4,'silhouette adaptation should materially alter multiple controls');

// Wide regions should generally become more conservative than similarly advanced thin regions.
const dWide=adaptive.details.reduce((a,b)=>Math.abs(b.u-.25)<Math.abs(a.u-.25)?b:a);
const dThin=adaptive.details.reduce((a,b)=>Math.abs(b.u-.48)<Math.abs(a.u-.48)?b:a);
assert.ok(dWide.widthNorm>dThin.widthNorm);
assert.ok((dWide.flex/dWide.baseFlex)<(dThin.flex/dThin.baseFlex),'wide section should be relatively more rigid than thin section');

const noAdapt=V4C.deriveAdaptiveControls(profile,{adaptivePreset:'character',adaptiveStrength:0,headLock:0,thicknessGuard:false,controlCount:9});
for(const d of noAdapt.details){
  assert.ok(Math.abs(d.flex-d.baseFlex)<1e-8);
  assert.ok(Math.abs(d.bend-d.baseBend)<1e-8);
}

const creature=V4C.deriveAdaptiveControls(profile,{adaptivePreset:'creature'});
const soft=V4C.deriveAdaptiveControls(profile,{adaptivePreset:'soft'});
assert.ok(creature.details.at(-1).flex>=adaptive.details.at(-1).flex*.85);
assert.ok(soft.details.some((d,i)=>d.flex>adaptive.details[i].flex),'soft preset should allow more flex somewhere');

const wideSafety=V4C.curvatureSafetyAt(profile,.25,{adaptivePreset:'character',spinePoints:38});
const thinSafety=V4C.curvatureSafetyAt(profile,.48,{adaptivePreset:'character',spinePoints:38});
assert.ok(wideSafety.localHalfRatio>thinSafety.localHalfRatio);
assert.ok(wideSafety.safeBend<thinSafety.safeBend,'wide silhouette should permit less local bend than thin silhouette');
assert.ok(adaptive.details.some(d=>d.geometryCapped),'character profile should activate thickness curvature guard somewhere');
const wideControl=adaptive.details.reduce((a,b)=>Math.abs(b.u-.25)<Math.abs(a.u-.25)?b:a);
assert.ok(wideControl.bend<=wideControl.safeBend+1e-9);

const summary=V4C.summarizeProfile(profile,adaptive);
assert.equal(summary.controlCount,9);
assert.ok(summary.maxWidth>summary.minWidth);
assert.ok(summary.transitions>=1);

// Abrupt width change should register as a stronger transition than a flat profile.
const abrupt=makeImage(120,80,u=>u<.5?.22:.82);
const flat=makeImage(120,80,()=>.50);
const abruptProfile=V4C.analyzeAlphaData(abrupt.data,abrupt.width,abrupt.height,{profileSamples:60,profileSmoothRadius:1});
const flatProfile=V4C.analyzeAlphaData(flat.data,flat.width,flat.height,{profileSamples:60,profileSmoothRadius:1});
assert.ok(abruptProfile.maxGradient>flatProfile.maxGradient+1e-4);

console.log('NagWeb Organic Adaptive Curve V4-C model tests: PASS');
