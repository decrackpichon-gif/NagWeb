import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const M=require('../js/nagweb-interaction-organic-v3.js');

assert.equal(M.version,'3.2.0-alpha.1');

const o=M.normalizeOptions({columns:32,rows:10,length:420});
assert.equal(o.columns,32);assert.equal(o.rows,10);assert.equal(o.length,420);
assert.ok(o.headZoneEnd<o.torsoZoneEnd);
assert.ok(o.headFlex<o.torsoFlex&&o.torsoFlex<o.lowerFlex);
assert.ok(o.headMaxBend<o.torsoMaxBend&&o.torsoMaxBend<o.bodyMaxBend);

const legacy=M.normalizeOptions({headRigidFraction:.27,rigidBlendWidth:.09});
assert.equal(legacy.headZoneEnd,.27);
assert.equal(legacy.zoneBlend,.09);

assert.equal(M.zoneAt(.05,o),'head');
assert.equal(M.zoneAt(.4,o),'torso');
assert.equal(M.zoneAt(.9,o),'lower');

const fHead=M.zoneFlexAt(.05,o),fTorso=M.zoneFlexAt(.44,o),fLower=M.zoneFlexAt(.9,o);
assert.ok(fHead<fTorso&&fTorso<fLower,'zone flexibility should increase from head to lower body');
const bHead=M.bendLimitAt(.05,o),bTorso=M.bendLimitAt(.44,o),bLower=M.bendLimitAt(.9,o);
assert.ok(bHead<bTorso&&bTorso<bLower,'bend allowance should increase from head to lower body');

const topo=M.createTopology(4,3,'right');
assert.equal(topo.vertices.length,20);
assert.equal(topo.indices.length,72);
assert.equal(topo.vertices[0].tx,1);
assert.equal(topo.vertices.at(-1).tx,0);
assert.equal(topo.vertices[0].ty,0);
assert.equal(topo.vertices[3].ty,1);

let spine=M.createSpine(34,500,300,0,420);
for(let n=0;n<60;n++){
  const h=n*.06;
  M.advanceSpine(spine,{x:500+Math.cos(h)*110,y:300+Math.sin(h)*90},420,h,o);
}
const expected=420/(34-1);
for(let i=1;i<spine.length;i++){
  const d=Math.hypot(spine[i].x-spine[i-1].x,spine[i].y-spine[i-1].y);
  assert.ok(Math.abs(d-expected)<1e-5,'spine segment length stays fixed');
}
for(let i=2;i<spine.length;i++){
  const a0=Math.atan2(spine[i-1].y-spine[i-2].y,spine[i-1].x-spine[i-2].x);
  const a1=Math.atan2(spine[i].y-spine[i-1].y,spine[i].x-spine[i-1].x);
  const d=Math.abs(Math.atan2(Math.sin(a1-a0),Math.cos(a1-a0)));
  assert.ok(d<=M.bendLimitAt((i-.5)/(spine.length-1),o)+1e-6,'local bend respects the zone profile');
}

const small=M.createTopology(2,2,'right');
const mesh=M.deformTopology(small,spine,600,300,1.2,o,.7);
assert.equal(mesh.positions.length,18);
assert.equal(mesh.texcoords.length,18);
assert.equal(mesh.indices.length,24);
assert.ok(mesh.positions.every(Number.isFinite));
assert.ok(mesh.texcoords.every(Number.isFinite));

const head=M.rigidFrame(spine,.05,1.2,o,.8);
const torso=M.rigidFrame(spine,.44,1.2,o,.8);
const lower=M.rigidFrame(spine,.9,1.2,o,.8);
assert.equal(head.zone,'head');assert.equal(torso.zone,'torso');assert.equal(lower.zone,'lower');
assert.ok(head.flexible<torso.flexible&&torso.flexible<lower.flexible,'mesh frames inherit the three-zone flexibility');
assert.ok(head.flexible<.12,'head stays almost rigid');
assert.ok(lower.flexible>.9,'lower body remains highly flexible');

const fit=M.fitTextureDimensions(8000,4000,4096);
assert.equal(fit.width,4096);assert.equal(fit.height,2048);assert.equal(fit.scaled,true);
const fitSmall=M.fitTextureDimensions(1200,900,4096);
assert.equal(fitSmall.width,1200);assert.equal(fitSmall.height,900);assert.equal(fitSmall.scaled,false);

const p0=M.advancePhase(0,0,o,16.6667),p1=M.advancePhase(0,1,o,16.6667);
assert.ok(p1>p0);

console.log('NagWeb Organic Mesh V3.2 model tests: PASS');
