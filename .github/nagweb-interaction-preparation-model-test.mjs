import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const P=require('../js/nagweb-interaction-preparation-v1.js');

assert.equal(P.version,'1.0.0-alpha.1');

const ready={
  needsBackgroundRemoval:false,silhouetteReliable:true,
  sourceWidth:900,sourceHeight:500,
  elongation:2.5,principalAxisAngle:12,
  subjectBounds:{x:.08,y:.12,width:.84,height:.72}
};
const poor={
  needsBackgroundRemoval:true,silhouetteReliable:false,
  sourceWidth:140,sourceHeight:120,
  elongation:1.1,principalAxisAngle:0,
  subjectBounds:{x:0,y:0,width:1,height:1}
};

const q1=P.scoreAnalysis(ready);
assert.equal(q1.level,'excellent');
assert.ok(q1.score>=90);

const q2=P.scoreAnalysis(poor);
assert.ok(q2.score<50);
assert.equal(q2.level,'blocked');

assert.equal(P.recommendMode(ready,{organicThreshold:1.75}).mode,'organic');
assert.equal(P.recommendMode({...ready,elongation:1.3},{organicThreshold:1.75}).mode,'follower');
assert.equal(P.recommendMode(poor,{organicThreshold:1.75}).mode,'follower');

const report=P.makeReport(poor,ready,P.recommendMode(ready,{organicThreshold:1.75}),true,true);
assert.equal(report.usedAI,true);
assert.equal(report.trimmed,true);
assert.equal(report.recommendedMode,'organic');
assert.equal(P.deserializeReport(P.serializeReport(report)).quality.level,'excellent');

const opts=P.normalizeOptions({maxDimension:9999,cropPadding:.7,organicThreshold:.4});
assert.equal(opts.maxDimension,1600);
assert.equal(opts.cropPadding,.2);
assert.equal(opts.organicThreshold,1.1);

console.log('NagWeb Interaction Preparation Pipeline V1 model tests: PASS');
