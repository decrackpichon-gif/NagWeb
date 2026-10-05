import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const V4=require('../js/nagweb-interaction-organic-v4.js');
const V3=require('../js/nagweb-interaction-organic-v3.js');

assert.equal(V4.version,'4.1.0-alpha.1');

const o=V4.normalizeOptions({});
assert.equal(o.boneCount,7);
assert.equal(o.maxInfluences,4);
assert.equal(o.skinMode,'rigid2d');
assert.equal(o.bonePositions[0],0);
assert.equal(o.bonePositions.at(-1),1);
for(let i=1;i<o.bonePositions.length;i++)assert.ok(o.bonePositions[i]>o.bonePositions[i-1]);
for(let i=1;i<o.boneFlex.length;i++)assert.ok(o.boneFlex[i]>=o.boneFlex[i-1]);

const rig=V4.createRig(o);
assert.equal(rig.count,7);
assert.equal(rig.bones[0].flex,.02);
assert.equal(rig.bones.at(-1).flex,1);

for(let s=0;s<=100;s++){
  const u=s/100,w=V4.boneWeightsAt(u,rig,o),sum=w.reduce((a,b)=>a+b.weight,0);
  assert.ok(Math.abs(sum-1)<1e-10,'weights normalize to one');
  assert.ok(w.length>=1&&w.length<=4,'compact influence count');
  assert.ok(w.every(x=>x.weight>=0&&x.weight<=1));
}
const head=V4.boneWeightsAt(.01,rig,o);
assert.equal(head[0].index,0);
const tail=V4.boneWeightsAt(.99,rig,o);
assert.equal(tail.at(-1).index,rig.count-1);

let previous=V4.boneWeightsAt(0,rig,o);
for(let s=1;s<=200;s++){
  const next=V4.boneWeightsAt(s/200,rig,o);
  const map=a=>Object.fromEntries(a.map(x=>[x.index,x.weight]));
  const a=map(previous),b=map(next),ids=new Set([...Object.keys(a),...Object.keys(b)]);
  let delta=0;for(const id of ids)delta+=Math.abs((a[id]||0)-(b[id]||0));
  assert.ok(delta<.35,'adjacent samples should not jump between bones');
  previous=next;
}

const topo=V4.createWeightedTopology(20,6,o);
assert.equal(topo.vertices.length,(20+1)*(6+1));
assert.equal(topo.indices.length,20*6*6);
const stats=V4.weightStats(topo);
assert.ok(Math.abs(stats.minSum-1)<1e-10);
assert.ok(Math.abs(stats.maxSum-1)<1e-10);
assert.ok(stats.maxInfluences<=4);

const length=400,spine=V3.createSpine(36,500,300,0,length);
const mesh=V4.deformTopology(topo,spine,400,200,0,{...o,length,sway:0},0);
assert.equal(mesh.positions.length,topo.vertices.length*2);
assert.ok(mesh.positions.every(Number.isFinite));
assert.equal(mesh.boneFrames.length,7);

for(const sample of [topo.vertices[0],topo.vertices[Math.floor(topo.vertices.length/2)],topo.vertices.at(-1)]){
  const p=V4.skinVertex(sample,mesh.rig,mesh.boneFrames,length,length*.5,o);
  const expectedX=500-length*sample.u;
  const expectedY=300+(sample.v-.5)*(length*.5);
  assert.ok(Math.abs(p.x-expectedX)<1e-4,'straight rig preserves longitudinal rest position');
  assert.ok(Math.abs(p.y-expectedY)<1e-4,'straight rig preserves transverse rest position');
}

const bent=V3.createSpine(36,500,300,0,length);
for(let i=1;i<bent.length;i++){
  const u=i/(bent.length-1),ang=Math.PI+u*.9;
  const seg=length/(bent.length-1);
  bent[i].x=bent[i-1].x+Math.cos(ang)*seg;
  bent[i].y=bent[i-1].y+Math.sin(ang)*seg;
}
const bentMesh=V4.deformTopology(topo,bent,400,200,.5,{...o,length,sway:0},.5);
assert.ok(bentMesh.positions.every(Number.isFinite));
assert.ok(bentMesh.boneFrames[0].flex<bentMesh.boneFrames[3].flex);
assert.ok(bentMesh.boneFrames[3].flex<bentMesh.boneFrames.at(-1).flex);

const testRig={bones:[{index:0,id:'a',u:.5},{index:1,id:'b',u:.5}]};
const testFrames=[{x:0,y:0,angle:-Math.PI/6},{x:0,y:0,angle:Math.PI/6}];
const testWeights=[{index:0,weight:.5},{index:1,weight:.5}];
const lbs=V4.skinPointLBS(0,50,testWeights,testRig,testFrames,0);
const rigid=V4.skinPointRigid2D(0,50,testWeights,testRig,testFrames,0);
assert.ok(Math.hypot(lbs.x,lbs.y)<49,'classic LBS should demonstrate expected shrink under opposing rotations');
assert.ok(Math.abs(Math.hypot(rigid.x,rigid.y)-50)<1e-8,'rigid2d blend should preserve radial length');
assert.equal(V4.normalizeOptions({skinMode:'lbs'}).skinMode,'lbs');
assert.equal(V4.normalizeOptions({skinMode:'unknown'}).skinMode,'rigid2d');

const custom=V4.normalizeOptions({boneCount:5,bonePositions:[0,.2,.5,.8,1],boneFlex:[0,.1,.4,.8,1],maxInfluences:2,weightRadius:.35});
assert.equal(V4.createRig(custom).count,5);
assert.ok(V4.boneWeightsAt(.5,V4.createRig(custom),custom).length<=2);

console.log('NagWeb Organic Skin V4.1 weighted-bone + rigid2d model tests: PASS');
