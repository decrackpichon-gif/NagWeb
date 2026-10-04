import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const O=require('../js/nagweb-interaction-organic-v2.js');

assert.equal(O.version,'2.1.0-alpha.1');

const opts=O.normalizeOptions({points:30,slices:60,length:290,sway:.04});
assert.equal(opts.points,30);assert.equal(opts.slices,60);assert.equal(opts.length,290);

let spine=O.createSpine(30,300,200,0,290);
assert.equal(spine.length,30);
assert.ok(Math.abs(spine[0].x-300)<1e-9);
assert.ok(Math.abs(spine.at(-1).x-10)<1e-9);
for(let i=1;i<spine.length;i++)assert.ok(Math.abs(Math.hypot(spine[i].x-spine[i-1].x,spine[i].y-spine[i-1].y)-10)<1e-6);

for(let n=0;n<80;n++){
  const a=n*.035,head={x:300+Math.cos(a)*120,y:220+Math.sin(a)*90};
  O.advanceSpine(spine,head,290,a);
}
for(let i=1;i<spine.length;i++)assert.ok(Math.abs(Math.hypot(spine[i].x-spine[i-1].x,spine[i].y-spine[i-1].y)-10)<1e-5,'segment length stays stable');

const headSample=O.sampleSpine(spine,0,1.2,opts,.8);
const tailSample=O.sampleSpine(spine,1,1.2,opts,.8);
assert.ok(Math.abs(headSample.sway)<1e-9,'head should not sway');
assert.ok(Math.abs(tailSample.sway)>0.01,'tail should sway');

const p0=O.advancePhase(0,0,opts,16.6667);
const p1=O.advancePhase(0,1,opts,16.6667);
assert.ok(p1>p0,'phase speeds up with movement');

const left=O.normalizeOptions({leadEnd:'left'}),right=O.normalizeOptions({leadEnd:'other'});
assert.equal(left.leadEnd,'left');assert.equal(right.leadEnd,'right');

console.log('NagWeb Organic Follower V2 model tests: PASS');
