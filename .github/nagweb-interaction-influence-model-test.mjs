import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const I=require('../js/nagweb-interaction-influence-v1.js');

assert.equal(I.version,'1.2.0');
const defaults=I.normalizeOptions({});
assert.ok(Object.values(defaults).filter(v=>typeof v==='number').every(Number.isFinite));
assert.equal(defaults.sourceMode,'body');
assert.equal(defaults.sweptBody,true);
assert.equal(I.normalizeOptions({sourceMode:'head'}).sourceMode,'head');
assert.equal(I.normalizeOptions({maxScale:0,maxRotate:0,maxPush:0}).maxScale,0);

const o=I.normalizeOptions({radius:100,strength:1,maxPush:50,maxRotate:10,maxScale:.1,spring:.08,damping:.84,sourceRadius:0});
const far=I.computeRepulsion({x:0,y:0},{x:150,y:0,radius:0},o);
assert.equal(far.strength,0);assert.equal(far.x,0);
const near=I.computeRepulsion({x:0,y:0},{x:50,y:0,radius:0},o);
assert.ok(near.strength>0);assert.ok(near.x>0);assert.equal(near.y,0);assert.ok(near.scale>1);
const thick=I.computeRepulsion({x:0,y:0,radius:60},{x:145,y:0,radius:0},o);
assert.ok(thick.strength>0,'source radius should extend the physical body field');

const cp=I.closestPointOnSegment({x:50,y:20},{x:0,y:0},{x:100,y:0});
assert.equal(cp.x,50);assert.equal(cp.y,0);assert.equal(cp.t,.5);
const path=[{x:0,y:0},{x:100,y:0},{x:200,y:80}];
const bodyNear=I.computePathRepulsion(path,{x:52,y:18,radius:0},o);
assert.ok(bodyNear.strength>0);
const headOnly=I.computeRepulsion(path[0],{x:52,y:18,radius:0},o);
assert.ok(bodyNear.strength>headOnly.strength);
assert.equal(I.computePathRepulsion(path,{x:400,y:400,radius:0},o).strength,0);

const prev=[{x:0,y:0},{x:80,y:0},{x:160,y:0}];
const curr=[{x:80,y:0},{x:160,y:0},{x:240,y:0}];
const target={x:120,y:45,radius:0};
const swept=I.computeSweptPathRepulsion(curr,prev,target,o);
const currentOnly=I.computePathRepulsion(curr,target,o);
assert.ok(swept.strength>=currentOnly.strength,'swept body should never weaken the current field');
const gapTarget={x:40,y:20,radius:0};
const sweptGap=I.computeSweptPathRepulsion(curr,prev,gapTarget,o);
const currentGap=I.computePathRepulsion(curr,gapTarget,o);
assert.ok(sweptGap.strength>currentGap.strength,'swept body should catch targets crossed between frames');

const telePrev=[{x:0,y:0},{x:30,y:0}],teleCurr=[{x:1000,y:0},{x:1030,y:0}];
const noTeleport=I.computeSweptPathRepulsion(teleCurr,telePrev,{x:500,y:0,radius:0},o);
assert.equal(noTeleport.strength,0,'large teleports should not push the whole page');

let state={x:0,y:0,vx:0,vy:0,rotation:0,vr:0,scale:1,vs:0,strength:0};
for(let i=0;i<120;i++)I.springStep(state,{x:40,y:-20,rotation:8,scale:1.08,strength:1},o,16.6667);
assert.ok(Math.abs(state.x-40)<1);assert.ok(Math.abs(state.y+20)<1);assert.ok(Math.abs(state.rotation-8)<1);assert.ok(Math.abs(state.scale-1.08)<.02);
for(let i=0;i<180;i++)I.springStep(state,{x:0,y:0,rotation:0,scale:1,strength:0},o,16.6667);
assert.ok(Math.abs(state.x)<1);assert.ok(Math.abs(state.y)<1);assert.ok(Math.abs(state.rotation)<1);assert.ok(Math.abs(state.scale-1)<.02);

console.log('NagWeb Interaction Influence V1.2 swept-body model tests: PASS');
