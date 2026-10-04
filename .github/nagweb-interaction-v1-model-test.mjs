import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const E=require('../js/nagweb-interaction-engine-v1.js');

assert.equal(E.version,'1.3.0');
assert.equal(E.schema,'nagweb-interaction-follower');
assert.deepEqual(E.runtimeStats(),{instances:0,active:0,running:false,frames:0,lastDt:0});
assert.deepEqual(Object.keys(E.presets).sort(),['agile','character','floating','heavy','magnetic','soft']);

const o=E.normalizeOptions({follow:99,damping:-1,maxSpeed:0,tilt:90,minScale:2,maxScale:1,distanceFromPointer:-20,edgeMode:'wat'});
assert.equal(o.follow,.65);assert.equal(o.damping,0);assert.equal(o.maxSpeed,.5);assert.equal(o.tilt,45);
assert.ok(o.minScale<=o.maxScale);assert.equal(o.distanceFromPointer,0);assert.equal(o.edgeMode,'free');
assert.equal(E.normalizeOptions({leaveBehavior:'wat'}).leaveBehavior,'idle');
assert.equal(E.normalizeOptions({leaveBehavior:'hold'}).leaveBehavior,'hold');
assert.equal(E.normalizeOptions({pauseWhenHidden:false}).pauseWhenHidden,false);

const character=E.normalizeOptions({preset:'character',assetForwardAngle:-90});
assert.equal(character.preset,'character');
assert.equal(character.distanceFromPointer,54);
assert.equal(character.assetForwardAngle,-90);

const bounds={x:0,y:0,width:1000,height:700};
let s=E.createState(500,350);
for(let i=0;i<120;i++) E.step(s,{x:850,y:500},bounds,E.normalizeOptions({idle:{enabled:false}}),16.6667,{width:100,height:100});
assert.ok(s.x>500&&s.y>350,'follower moves toward target');
assert.ok(Math.hypot(s.vx,s.vy)<=E.defaults.maxSpeed+0.001,'speed is capped');

const before={x:s.x,y:s.y};
for(let i=0;i<90;i++) E.step(s,{x:150,y:120},bounds,E.normalizeOptions({turnSmoothing:.08}),16.6667,{width:100,height:100});
assert.ok(s.x<before.x,'follower can reverse direction smoothly');

const spaced=E.resolveFollowTarget({x:0,y:0},{x:100,y:0},25);
assert.equal(Math.round(spaced.x),75);
assert.equal(spaced.y,0);
const near=E.resolveFollowTarget({x:80,y:0},{x:100,y:0},25);
assert.deepEqual(near,{x:80,y:0});

const upFacing=E.normalizeOptions({assetForwardAngle:-90,turnSmoothing:1,damping:0,follow:.1,maxSpeed:100});
let r=E.createState(0,0);
E.step(r,{x:100,y:0},{x:0,y:0,width:500,height:500},upFacing,16.6667,{width:10,height:10});
assert.ok(Math.abs(r.angle-Math.PI/2)<0.001,'asset forward angle is compensated');

const a=E.idleTarget(1000,bounds,E.normalizeOptions({idle:{enabled:true}}));
const b=E.idleTarget(5000,bounds,E.normalizeOptions({idle:{enabled:true}}));
assert.ok(a.x!==b.x||a.y!==b.y,'idle target changes over time');

const contained=E.normalizeOptions({edgeMode:'contain',edgePadding:20});
let c=E.createState(990,690);c.vx=100;c.vy=100;
E.step(c,{x:2000,y:2000},bounds,contained,16.6667,{width:100,height:80});
assert.ok(c.x<=930&&c.y<=640,'asset dimensions are respected at bounds');

const serialized=E.serializeOptions({preset:'soft',assetForwardAngle:180,edgeMode:'contain'});
const restored=E.deserializeOptions(serialized);
assert.equal(restored.assetForwardAngle,180);assert.equal(restored.edgeMode,'contain');assert.equal(restored.preset,'soft');
assert.throws(()=>E.deserializeOptions('{"schema":"wrong","version":1,"options":{}}'));

console.log('NagWeb Interaction Engine V1.3 model tests: PASS');
