import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const S=require('../js/nagweb-interaction-session-v1.js');

assert.equal(S.version,'1.3.0-alpha.1');
const s=S.normalize({
  mode:'auto',
  organicRenderer:'mesh-v3',
  bodyProfile:'character',
  display:{size:540},
  influenceEnabled:true,
  followerOptions:{follow:.12,maxSpeed:44,distanceFromPointer:36,assetForwardAngle:90},
  organicOptions:{length:510,sway:.06,columns:36,rows:12,headZoneEnd:.2,torsoZoneEnd:.64,headFlex:.04,torsoFlex:.4,lowerFlex:1},
  influenceOptions:{radius:240,strength:1.2,sourceMode:'body',sweptBody:true,targetScenario:'all'},
  preparationReport:{recommendedMode:'organic',quality:{score:96}},
  metadata:{name:'Prueba'}
});
assert.equal(s.schema,S.schema);
assert.equal(S.resolveMode(s),'organic');
assert.equal(s.organicRenderer,'mesh-v3');
assert.equal(s.bodyProfile,'character');
assert.equal(s.display.size,540);
assert.equal(S.summary(s).organicRenderer,'mesh-v3');
assert.equal(S.summary(s).bodyProfile,'character');
assert.equal(S.summary(s).displaySize,540);
assert.equal(S.summary(s).quality,96);

const forced=S.normalize({...s,mode:'follower'});
assert.equal(S.resolveMode(forced),'follower');

const round=S.deserialize(S.serialize(s));
assert.equal(round.organicOptions.length,510);
assert.equal(round.organicOptions.columns,36);
assert.equal(round.influenceOptions.radius,240);assert.equal(round.influenceOptions.targetScenario,'all');assert.equal(round.influenceOptions.sweptBody,true);
assert.equal(round.organicRenderer,'mesh-v3');
assert.equal(round.bodyProfile,'character');
assert.equal(round.display.size,540);

const legacy=S.normalize({mode:'organic',organicOptions:{length:380}});
assert.equal(legacy.organicRenderer,'slices-v2');
assert.equal(legacy.bodyProfile,'custom');
assert.equal(legacy.display.size,380);assert.equal(legacy.influenceOptions.targetScenario,'headline');

assert.throws(()=>S.deserialize('{"bad":true}'),/invalid session/);
console.log('NagWeb Interaction Session V1.3 model tests: PASS');
