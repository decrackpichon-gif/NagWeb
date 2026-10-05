import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const M=require('../js/nagweb-interaction-organic-v3.js');

assert.equal(M.version,'3.0.0-alpha.1');
const o=M.normalizeOptions({columns:32,rows:10,length:420});
assert.equal(o.columns,32);assert.equal(o.rows,10);assert.equal(o.length,420);

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
for(let i=2;i<8;i++){
  const a0=Math.atan2(spine[i-1].y-spine[i-2].y,spine[i-1].x-spine[i-2].x);
  const a1=Math.atan2(spine[i].y-spine[i-1].y,spine[i].x-spine[i-1].x);
  const d=Math.abs(Math.atan2(Math.sin(a1-a0),Math.cos(a1-a0)));
  assert.ok(d<=M.bendLimitAt((i-.5)/(spine.length-1),o)+1e-6,'head bend is protected');
}

const small=M.createTopology(2,2,'right');
const mesh=M.deformTopology(small,spine,600,300,1.2,o,.7);
assert.equal(mesh.positions.length,18);
assert.equal(mesh.texcoords.length,18);
assert.equal(mesh.indices.length,24);
assert.ok(mesh.positions.every(Number.isFinite));
assert.ok(mesh.texcoords.every(Number.isFinite));

const stride=small.rows+1;
for(let r=0;r<=small.rows;r++){
  const shared=1*stride+r;
  assert.ok(Number.isFinite(mesh.positions[shared*2])&&Number.isFinite(mesh.positions[shared*2+1]),'shared grid vertex exists once');
}

const head=M.rigidFrame(spine,0,1.2,o,.8);
const near=M.rigidFrame(spine,o.headRigidFraction*.35,1.2,o,.8);
const body=M.rigidFrame(spine,.7,1.2,o,.8);
assert.equal(head.flexible,0);
assert.ok(near.flexible<.5,'near-head geometry remains mostly rigid');
assert.ok(body.flexible>.99,'body follows flexible centerline');

const p0=M.advancePhase(0,0,o,16.6667),p1=M.advancePhase(0,1,o,16.6667);
assert.ok(p1>p0);

console.log('NagWeb Organic Mesh V3.0 model tests: PASS');
