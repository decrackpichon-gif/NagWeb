import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const V4C=require('../js/nagweb-interaction-organic-v4c.js');

function raster(w,h,widthFn,centerFn){
  const data=new Uint8ClampedArray(w*h*4);
  for(let x=0;x<w;x++){
    const u=1-x/(w-1),half=Math.max(1,Math.round(widthFn(u)*h*.5)),cy=Math.round((centerFn?centerFn(u):.5)*h);
    for(let y=Math.max(0,cy-half);y<=Math.min(h-1,cy+half);y++){const i=(y*w+x)*4;data[i]=255;data[i+1]=150;data[i+2]=90;data[i+3]=255;}
  }
  return {data,width:w,height:h};
}
function evaluate(name,img,preset){
  const profile=V4C.analyzeAlphaData(img.data,img.width,img.height,{profileSamples:96,profileSmoothRadius:2,adaptivePreset:preset});
  const controls=V4C.deriveAdaptiveControls(profile,{adaptivePreset:preset,controlCount:preset==='creature'?10:9,spinePoints:38});
  assert.ok(profile.points.every(p=>Number.isFinite(p.width)&&Number.isFinite(p.gradientNorm)),name+' finite profile');
  assert.ok(controls.details.every(d=>Number.isFinite(d.flex)&&Number.isFinite(d.bend)&&d.bend>0),name+' finite controls');
  assert.ok(controls.details.some(d=>d.geometryCapped),name+' thickness guard should activate somewhere');
  assert.ok(controls.details.filter(d=>d.geometryCapped).every(d=>d.bend<=d.safeBend+1e-9),name+' caps respected');
  return {profile,controls};
}

const humanoid=raster(180,110,u=>u<.14?.24:u<.32?.48:u<.54?.72:u<.70?.43:u<.90?.82:.30);
const tallThin=raster(220,72,u=>u<.18?.36:u<.45?.52:u<.72?.46:.26,u=>.5+.04*Math.sin(u*Math.PI*2));
const creature=raster(170,120,u=>.34+.48*Math.pow(Math.sin(Math.PI*u),2),u=>.5+.10*Math.sin(u*Math.PI*1.5));
const blob=raster(150,140,u=>.72-.12*Math.cos(u*Math.PI*2));

const a=evaluate('humanoid',humanoid,'character');
const b=evaluate('tall-thin',tallThin,'character');
const c=evaluate('creature',creature,'creature');
const d=evaluate('blob',blob,'soft');

function bends(x){return x.controls.bend.map(v=>Number(v.toFixed(5)));}
assert.notDeepEqual(bends(a),bends(b),'different silhouettes should not collapse to identical bend fields');
assert.notDeepEqual(bends(a),bends(c),'character and creature should derive different behavior');
assert.notDeepEqual(bends(c),bends(d),'creature and soft blob should derive different behavior');

const wide=a.controls.details.reduce((p,n)=>n.widthNorm>p.widthNorm?n:p,a.controls.details[0]);
const thin=a.controls.details.reduce((p,n)=>n.widthNorm<p.widthNorm?n:p,a.controls.details[0]);
assert.ok(wide.safeBend<thin.safeBend,'wider local body must receive a tighter geometric curvature limit');

console.log('NagWeb V4-C.1 multi-silhouette consolidation tests: PASS');