import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const V4B=require('../js/nagweb-interaction-organic-v4b.js');

assert.equal(V4B.version,'4.2.0-alpha.1');

const o=V4B.normalizeOptions({});
assert.equal(o.controlCount,7);
assert.equal(o.antiFold,true);
assert.equal(o.controlPositions[0],0);
assert.equal(o.controlPositions.at(-1),1);
for(let i=1;i<o.controlPositions.length;i++)assert.ok(o.controlPositions[i]>o.controlPositions[i-1]);
for(let i=1;i<o.controlFlex.length;i++)assert.ok(o.controlFlex[i]>=o.controlFlex[i-1]);
for(let i=1;i<o.controlBend.length;i++)assert.ok(o.controlBend[i]>=o.controlBend[i-1]);

const controls=V4B.createControls(o);
for(let s=0;s<=100;s++){
  const u=s/100,w=V4B.weightsAt(u,controls,o),sum=w.reduce((a,b)=>a+b.weight,0);
  assert.ok(Math.abs(sum-1)<1e-10);
  assert.ok(w.every(x=>x.weight>=0&&x.weight<=1));
  assert.ok(Number.isFinite(V4B.flexAt(u,o)));
  assert.ok(Number.isFinite(V4B.bendAt(u,o)));
}
assert.ok(V4B.flexAt(.02,o)<V4B.flexAt(.5,o));
assert.ok(V4B.flexAt(.5,o)<V4B.flexAt(.95,o));
assert.ok(V4B.bendAt(.02,o)<V4B.bendAt(.95,o));

const cross=V4B.closestPointsSegments({x:0,y:0},{x:100,y:100},{x:0,y:100},{x:100,y:0});
assert.ok(cross.distance<1e-8);
assert.ok(Math.abs(cross.a.x-50)<1e-6&&Math.abs(cross.a.y-50)<1e-6);

const length=360,count=19,seg=length/(count-1);
// Deliberately build a hairpin/self-crossing chain while keeping roughly constant segment length.
const folded=[];
for(let i=0;i<7;i++)folded.push({x:300-i*seg,y:240});
for(let i=7;i<13;i++){
  const t=(i-6)/6*Math.PI;
  folded.push({x:180+Math.cos(t)*60,y:240+Math.sin(t)*60});
}
while(folded.length<count){
  const p=folded.at(-1);folded.push({x:p.x+seg,y:p.y-8});
}
const before=V4B.spineMinSeparation(folded,4);
const guarded=folded.map(p=>({...p}));
const res=V4B.antiFoldGuard(guarded,length,0,{...o,length,antiFoldDistance:1.35,antiFoldStrength:.65,antiFoldIterations:3});
const after=V4B.spineMinSeparation(guarded,4);
assert.ok(res.conflicts>0,'synthetic fold should trigger anti-fold guard');
assert.ok(after.distance>before.distance+1e-5,'anti-fold should increase non-neighbour separation');

const straight=V4B.createSpine(38,500,300,0,380);
const advanced=V4B.advanceSpine(straight,{x:500,y:300},380,0,{...o,sway:0});
assert.equal(advanced.conflicts,0);
const sep=V4B.spineMinSeparation(straight,o.antiFoldGap);
assert.ok(sep.distance>0);

const topo=V4B.createTopology(30,10,'right');
const mesh=V4B.deformTopology(topo,straight,400,200,0,{...o,length:380,sway:0},0);
assert.equal(mesh.positions.length,topo.vertices.length*2);
assert.ok(mesh.positions.every(Number.isFinite));
assert.equal(mesh.frames.length,31);

// One longitudinal u -> one frame. Rows in the same column must share the same frame axis.
for(let c=0;c<=topo.columns;c+=5){
  const f=mesh.frames[c];
  assert.ok(Number.isFinite(f.x)&&Number.isFinite(f.y)&&Number.isFinite(f.angle));
}
const stride=topo.rows+1;
for(let c=0;c<=topo.columns;c+=6){
  const a=c*stride,b=c*stride+topo.rows;
  const dx=mesh.positions[b*2]-mesh.positions[a*2],dy=mesh.positions[b*2+1]-mesh.positions[a*2+1];
  const h=Math.hypot(dx,dy);
  assert.ok(h>1,'column must retain nonzero transverse width');
}

const localDips=V4B.normalizeOptions({controlCount:5,controlBend:[.05,.12,.07,.20,.26],controlFlex:[.03,.20,.12,.65,1],preserveLocalControlDips:true});
assert.ok(localDips.controlBend[2]<localDips.controlBend[1],'local bend dips should survive when explicitly enabled');
assert.ok(localDips.controlFlex[2]<localDips.controlFlex[1],'local flex dips should survive when explicitly enabled');
const monotonic=V4B.normalizeOptions({controlCount:5,controlBend:[.05,.12,.07,.20,.26],controlFlex:[.03,.20,.12,.65,1]});
assert.ok(monotonic.controlBend[2]>=monotonic.controlBend[1],'V4-B default should remain monotonic');
assert.ok(monotonic.controlFlex[2]>=monotonic.controlFlex[1],'V4-B default flex should remain monotonic');

const custom=V4B.normalizeOptions({controlCount:9,antiFold:false,weightRadius:.31});
assert.equal(V4B.createControls(custom).count,9);
const noGuard=V4B.antiFoldGuard(folded.map(p=>({...p})),length,0,custom);
assert.equal(noGuard.conflicts,0);

console.log('NagWeb Organic Weighted Curve V4-B model tests: PASS');
